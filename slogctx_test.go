package slogctx

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"strings"
	"testing"
)

// newTestLogger returns a logger writing JSON to a buffer, plus a decode helper.
func newTestLogger(t *testing.T, opts ...Option) (*slog.Logger, func() map[string]any) {
	t.Helper()
	var buf bytes.Buffer
	h := NewHandler(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug}), opts...)
	logger := slog.New(h)
	return logger, func() map[string]any {
		line := strings.TrimSpace(buf.String())
		if line == "" {
			t.Fatal("no log output was produced")
		}
		if i := strings.LastIndex(line, "\n"); i >= 0 {
			line = line[i+1:]
		}
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			t.Fatalf("log line is not valid JSON (%v): %s", err, line)
		}
		buf.Reset()
		return m
	}
}

func TestContextAttrsAppearOnRecords(t *testing.T) {
	logger, decode := newTestLogger(t)
	ctx := With(context.Background(), "request_id", "abc123", "tenant", "acme")

	logger.InfoContext(ctx, "hello", "amount", 42)

	m := decode()
	if m["request_id"] != "abc123" || m["tenant"] != "acme" {
		t.Fatalf("context attributes missing from record: %v", m)
	}
	if m["amount"] != 42.0 {
		t.Fatalf("call-site attribute missing: %v", m)
	}
	if m["msg"] != "hello" {
		t.Fatalf("message = %v, want %q", m["msg"], "hello")
	}
}

func TestPlainContextIsUnaffected(t *testing.T) {
	logger, decode := newTestLogger(t)
	logger.InfoContext(context.Background(), "no extras", "k", "v")
	m := decode()
	if m["k"] != "v" || m["msg"] != "no extras" {
		t.Fatalf("record altered without context attributes: %v", m)
	}
}

func TestWithAccumulatesAcrossCalls(t *testing.T) {
	logger, decode := newTestLogger(t)
	ctx := With(context.Background(), "a", 1)
	ctx = With(ctx, "b", 2)
	ctx = WithAttrs(ctx, slog.String("c", "three"))

	logger.InfoContext(ctx, "layered")

	m := decode()
	for k, want := range map[string]any{"a": 1.0, "b": 2.0, "c": "three"} {
		if m[k] != want {
			t.Errorf("attribute %q = %v, want %v", k, m[k], want)
		}
	}
}

func TestParentContextIsNotMutated(t *testing.T) {
	logger, decode := newTestLogger(t)
	parent := With(context.Background(), "shared", "yes")
	child := With(parent, "only_child", "true")

	logger.InfoContext(child, "child")
	if m := decode(); m["only_child"] != "true" || m["shared"] != "yes" {
		t.Fatalf("child record = %v", m)
	}

	logger.InfoContext(parent, "parent")
	if m := decode(); m["only_child"] != nil {
		t.Fatalf("child attribute leaked into the parent context: %v", m)
	}
}

func TestCallSiteAttributesWinOverContext(t *testing.T) {
	logger, decode := newTestLogger(t, WithDedup())
	ctx := With(context.Background(), "stage", "from-context")

	logger.InfoContext(ctx, "override", "stage", "from-call")

	m := decode()
	if m["stage"] != "from-call" {
		t.Fatalf("stage = %v, want the call-site value to win", m["stage"])
	}
}

func TestDedupKeepsTheLastValue(t *testing.T) {
	logger, decode := newTestLogger(t, WithDedup())
	logger.Info("dupes", "k", "first", "k", "second", "other", 1)

	m := decode()
	if m["k"] != "second" {
		t.Fatalf("k = %v, want %q", m["k"], "second")
	}
	if m["other"] != 1.0 {
		t.Fatalf("unrelated key lost during de-duplication: %v", m)
	}
}

func TestWithoutDedupDuplicatesArePreserved(t *testing.T) {
	// The standard handlers emit both; this test pins that we do not change
	// that behaviour unless WithDedup is requested.
	var buf bytes.Buffer
	logger := slog.New(NewHandler(slog.NewTextHandler(&buf, nil)))
	logger.Info("dupes", "k", "first", "k", "second")
	if got := strings.Count(buf.String(), "k="); got != 2 {
		t.Fatalf("found %d occurrences of the key, want 2 without WithDedup: %s", got, buf.String())
	}
}

func TestWithAttrsOnLoggerStillWorks(t *testing.T) {
	logger, decode := newTestLogger(t)
	logger = logger.With("service", "billing")
	ctx := With(context.Background(), "request_id", "r-1")

	logger.InfoContext(ctx, "combined")

	m := decode()
	if m["service"] != "billing" || m["request_id"] != "r-1" {
		t.Fatalf("logger and context attributes did not combine: %v", m)
	}
}

func TestGroupsDoNotSwallowContextAttrs(t *testing.T) {
	logger, decode := newTestLogger(t)
	ctx := With(context.Background(), "request_id", "r-2")
	logger.WithGroup("http").InfoContext(ctx, "grouped", "status", 200)

	m := decode()
	group, ok := m["http"].(map[string]any)
	if !ok {
		t.Fatalf("expected an http group in %v", m)
	}
	if group["status"] != 200.0 {
		t.Fatalf("call-site attribute missing from the group: %v", group)
	}
	// The context attribute must not be nested inside the caller's group.
	if _, nested := group["request_id"]; nested {
		t.Fatalf("context attribute was nested inside the group: %v", group)
	}
}

func TestEnabledDelegatesToInnerHandler(t *testing.T) {
	h := NewHandler(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelWarn}))
	if h.Enabled(context.Background(), slog.LevelInfo) {
		t.Error("Info reported as enabled although the inner handler is set to Warn")
	}
	if !h.Enabled(context.Background(), slog.LevelError) {
		t.Error("Error reported as disabled although the inner handler is set to Warn")
	}
}

func TestAttrsOnEmptyAndNilContext(t *testing.T) {
	if got := Attrs(context.Background()); got != nil {
		t.Errorf("Attrs on a plain context = %v, want nil", got)
	}
	if got := Attrs(nil); got != nil { //nolint:staticcheck // deliberately testing nil
		t.Errorf("Attrs(nil) = %v, want nil", got)
	}
	ctx := With(context.Background()) // no arguments
	if got := Attrs(ctx); got != nil {
		t.Errorf("With with no arguments stored %v", got)
	}
}

func TestOddArgumentsBecomeBadKey(t *testing.T) {
	logger, decode := newTestLogger(t)
	ctx := With(context.Background(), "dangling")
	logger.InfoContext(ctx, "odd")
	if m := decode(); m["!BADKEY"] != "dangling" {
		t.Fatalf("dangling key not reported as !BADKEY: %v", m)
	}
}

func TestNilInnerHandlerPanics(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("NewHandler(nil) did not panic")
		}
	}()
	NewHandler(nil)
}
