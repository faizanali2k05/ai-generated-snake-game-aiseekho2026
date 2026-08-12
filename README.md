# slogctx

Carry structured logging fields on a `context.Context` and have them appear on every record.

`log/slog` is the standard logger, but has no way to attach a request ID and have it show up downstream. The workarounds — threading a `*slog.Logger` through every signature, or repeating attributes at every call site — are noisy, and both fail the moment a helper deep in the stack logs something.

```go
// once, at startup
slog.SetDefault(slog.New(slogctx.NewHandler(slog.NewJSONHandler(os.Stdout, nil))))

// in middleware
ctx = slogctx.With(ctx, "request_id", id, "tenant", tenant)

// anywhere
slog.InfoContext(ctx, "charge accepted", "amount", amt)
// {"msg":"charge accepted","request_id":"...","tenant":"...","amount":...}
```

Call-site attributes win over context ones. Context attributes are not nested inside a group you opened. `WithDedup()` also collapses duplicate keys — something neither standard handler does. Standard library only.

    go get github.com/yourname/slogctx

MIT.
