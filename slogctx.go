// Package slogctx carries structured logging fields on a context.Context and
// adds them to every record a handler writes.
//
// log/slog is the standard logger, but it has no way to attach a request ID or
// tenant to a context and have it appear on every downstream log line. The
// usual workarounds are to thread a *slog.Logger through every function
// signature, or to pass the same attributes at every call site. Both are noisy,
// and both fail the moment a helper deep in the stack logs something.
//
// Wrap a handler once at startup:
//
//	logger := slog.New(slogctx.NewHandler(slog.NewJSONHandler(os.Stdout, nil)))
//	slog.SetDefault(logger)
//
// Attach fields where you have them, usually in middleware:
//
//	ctx = slogctx.With(ctx, "request_id", id, "tenant", tenant)
//
// Then log normally. Any call that passes the context gets the fields:
//
//	slog.InfoContext(ctx, "charge accepted", "amount", amt)
//	// {"msg":"charge accepted","request_id":"...","tenant":"...","amount":...}
//
// The handler can also de-duplicate attribute keys, which neither of the
// standard handlers does. See WithDedup.
//
// The package has no dependencies outside the standard library.
package slogctx

import (
	"context"
	"log/slog"
)

type ctxKey struct{}

// With returns a context carrying the given attributes in addition to any
// already present. Arguments follow the same alternating key/value convention
// as slog.Logger.With.
func With(ctx context.Context, args ...any) context.Context {
	if len(args) == 0 {
		return ctx
	}
	return WithAttrs(ctx, argsToAttrs(args)...)
}

// WithAttrs returns a context carrying the given attributes in addition to any
// already present.
func WithAttrs(ctx context.Context, attrs ...slog.Attr) context.Context {
	if len(attrs) == 0 {
		return ctx
	}
	existing := Attrs(ctx)
	merged := make([]slog.Attr, 0, len(existing)+len(attrs))
	merged = append(merged, existing...)
	merged = append(merged, attrs...)
	return context.WithValue(ctx, ctxKey{}, merged)
}

// Attrs returns the attributes carried by ctx. The result must not be modified.
func Attrs(ctx context.Context) []slog.Attr {
	if ctx == nil {
		return nil
	}
	attrs, _ := ctx.Value(ctxKey{}).([]slog.Attr)
	return attrs
}

// Option configures a Handler.
type Option func(*Handler)

// WithDedup makes the handler drop earlier attributes that share a key with a
// later one, so the value nearest the log call wins. The standard handlers emit
// duplicate keys instead, which produces invalid-ish JSON that many log
// pipelines silently mishandle.
//
// De-duplication applies to top-level attributes; keys inside groups are left
// alone, since a group already namespaces them.
func WithDedup() Option {
	return func(h *Handler) { h.dedup = true }
}

// A Handler wraps another slog.Handler, adding context-carried attributes to
// every record it passes through.
type Handler struct {
	inner slog.Handler
	dedup bool
	// grouped reports whether WithGroup has been called; context attributes are
	// only injected at the top level, so they are not nested inside a group the
	// caller opened for unrelated data.
	grouped bool
}

// NewHandler wraps inner. It returns inner unchanged if it is nil-free logging
// is not the caller's intent; passing nil panics.
func NewHandler(inner slog.Handler, opts ...Option) *Handler {
	if inner == nil {
		panic("slogctx: nil inner handler")
	}
	h := &Handler{inner: inner}
	for _, o := range opts {
		o(h)
	}
	return h
}

// Enabled reports whether the wrapped handler handles records at the given level.
func (h *Handler) Enabled(ctx context.Context, l slog.Level) bool {
	return h.inner.Enabled(ctx, l)
}

// WithAttrs returns a new Handler whose records carry the given attributes.
func (h *Handler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &Handler{inner: h.inner.WithAttrs(attrs), dedup: h.dedup, grouped: h.grouped}
}

// WithGroup returns a new Handler that qualifies subsequent attributes with the
// given group name.
func (h *Handler) WithGroup(name string) slog.Handler {
	if name == "" {
		return h
	}
	return &Handler{inner: h.inner.WithGroup(name), dedup: h.dedup, grouped: true}
}

// Handle adds the context's attributes to the record and forwards it. Attributes
// from the log call take precedence over those from the context.
func (h *Handler) Handle(ctx context.Context, r slog.Record) error {
	ctxAttrs := Attrs(ctx)
	if len(ctxAttrs) == 0 && !h.dedup {
		return h.inner.Handle(ctx, r)
	}

	recAttrs := make([]slog.Attr, 0, r.NumAttrs())
	r.Attrs(func(a slog.Attr) bool {
		recAttrs = append(recAttrs, a)
		return true
	})

	// Context attributes come first so record attributes win on conflict, and
	// so they are not buried under a group opened by the caller.
	var combined []slog.Attr
	if h.grouped {
		combined = recAttrs
	} else {
		combined = make([]slog.Attr, 0, len(ctxAttrs)+len(recAttrs))
		combined = append(combined, ctxAttrs...)
		combined = append(combined, recAttrs...)
	}
	if h.dedup {
		combined = dedup(combined)
	}

	out := slog.NewRecord(r.Time, r.Level, r.Message, r.PC)
	out.AddAttrs(combined...)
	return h.inner.Handle(ctx, out)
}

// dedup keeps the last attribute for each key, preserving the position of that
// last occurrence.
func dedup(attrs []slog.Attr) []slog.Attr {
	lastIndex := make(map[string]int, len(attrs))
	for i, a := range attrs {
		lastIndex[a.Key] = i
	}
	out := attrs[:0:0]
	for i, a := range attrs {
		if lastIndex[a.Key] == i {
			out = append(out, a)
		}
	}
	return out
}

// argsToAttrs converts alternating key/value arguments, mirroring the behaviour
// of slog.Logger.With. A trailing key without a value is recorded under the
// "!BADKEY" key, as slog does.
func argsToAttrs(args []any) []slog.Attr {
	var attrs []slog.Attr
	for i := 0; i < len(args); {
		switch a := args[i].(type) {
		case slog.Attr:
			attrs = append(attrs, a)
			i++
		case string:
			if i+1 >= len(args) {
				attrs = append(attrs, slog.String("!BADKEY", a))
				i++
				continue
			}
			attrs = append(attrs, slog.Any(a, args[i+1]))
			i += 2
		default:
			attrs = append(attrs, slog.Any("!BADKEY", a))
			i++
		}
	}
	return attrs
}
