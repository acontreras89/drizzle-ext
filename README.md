# Drizzle ORM's extension kit

A set of utilities and helpers to construct **type-safe, complex SQL expressions**, improving the ergonomics of working with [Drizzle ORM](https://orm.drizzle.team/).

It targets **PostgreSQL**. A few helpers are plain enough to work anywhere, but most lean on PostgreSQL functions, types or driver behaviour, and some decode values the way the PostgreSQL driver hands them over. Sorting out which ones suit your engine, and porting the rest, is left to you.

> [!WARNING]
> **This depends on Drizzle internals that can change without notice.**
>
> To infer result types, the kit reads values that Drizzle explicitly marks as internal — most notably `SQL#decoder`, which is not part of its public typings and is assigned by `mapWith` at runtime. That is why you will find `@ts-expect-error` comments in [`src/lib.ts`](src/lib.ts). It also augments the module to retype some of Drizzle's own helpers.
>
> The helpers themselves are small, and tested as far as they can be without a database. The risk is not in them — it is in the private API they stand on, which no version guarantee covers. Any Drizzle upgrade can break them, and `1.0` almost certainly will.

## Motivation

As a codebase and its queries grow in complexity, you end up reaching for Drizzle's `sql` template helper more and more. It's a good escape hatch: you can write raw SQL and interpolate columns or other SQL wrappers into it. But it costs you three things.

**You lose type inference**, which is one of the strongest arguments for using Drizzle in the first place. The `sql` helper does take a generic parameter, and it will happily assume the query resolves to whatever you passed:

```ts
sql<{ id: number; title: string }[]>`
  json_agg(json_build_object('id', ${books.id}, 'title', ${books.title}))
`
```

That is not inference — it's an assertion. You are telling the compiler to take your word for it, and nothing checks that the claim was right in the first place, let alone that it survives a refactor of the underlying columns.

**You also have to carry PostgreSQL in your head.** Raw SQL inside a template is opaque to the editor: nothing tells you which function to reach for, what arguments it takes, or what it gives back. A typed helper puts all of that at the call site — signature, contract, JSDoc, autocompletion — and the API becomes discoverable again instead of something you go and look up. It tends to surface simpler formulations too. This sort of thing kept turning up in our codebase:

```ts
sum(sql<number>`
  case
    when ${table.booleanColumn} = true
      then 1
    else 0
  end
`)

// the same thing, once you can see what is on offer
count(table.id).filterWhere(table.booleanColumn)

// or even
sum(cast.int(table.booleanColumn))
```

**And the formatting fights you.** Template literals keep your whitespace and newlines exactly as written, while Drizzle's logger prints each query on a single line. So if you indent the SQL to be readable in the source, that indentation gets dumped into the query trace; if you write it to read well in the trace, it's a wall of text in your editor. You can have it nice in one place or the other, not both. Minor next to the typing issue, but it grates.

Drizzle ships helpers for the most common operations, and the gaps are a little unpredictable — fairly niche things like `arrayOverlaps` are covered, while plenty of everyday ground isn't. On the last project where I worked, our queries got genuinely hairy, mostly through `json_agg` and `json_build_object`, so this small layer of helpers grew out of the need to keep that readable and typed:

```ts
db.select({
  author: authors.name,
  books: jsonAgg(jsonBuildObject({ id: books.id, title: books.title })),
})
// books is inferred as { id: number; title: string }[]
```

## The expression vocabulary

Drizzle exposes `SQLWrapper`, the interface implemented by anything that can produce SQL — including tables and subqueries. That makes it too permissive to use as a parameter type in helpers like these.

So the kit narrows it into three types, named after the capability each one guarantees. They are internal to the design but exported, since they show up in the helpers' public signatures:

| Type            | Decodable | Embeddable      | Raw JS values |
| --------------- | --------- | --------------- | ------------- |
| `Expression<T>` | yes       | yes             | no            |
| `Operand<T>`    | maybe     | yes             | no            |
| `Input<T>`      | maybe     | via `toOperand` | yes           |

- **`Expression<T>`** — `SQL`, `SQL.Aliased` and `Column`: the values that carry a decoder, so a raw driver value can be mapped back to JS. This is what the helpers take for the argument that determines their result, because that argument's decoder and inferred type flow into the output.
- **`Operand<T>`** — an `Expression` plus `Param`. Anything that can be interpolated into a `sql` template, whether or not it can be read back out. Mostly appears in return positions and internals.
- **`Input<T>`** — an `Operand` or a plain JS value. What the ergonomic argument positions accept: delimiters, defaults, bounds, and the like.

Three functions round it out: `getDecoder` and `findEncoder` reach into the value to pull out its mappers, and `toOperand` normalizes an `Input` by wrapping raw JS values into a `Param`.

`toOperand` is modelled on Drizzle's own internal `bindIfParam`, which its helpers use for exactly this purpose. The difference is that it takes a standalone encoder rather than requiring a column to borrow one from, and it preserves the value type.

## Nullability

Working with SQL expressions is hard to type well, and nullability is the worst of it. With `SUM`, `ROUND` or `AVG` it is very hard to know up front whether the result can be null. It depends on the column definition — nullable or not — but also on where the column came from: if it originates in a joined table, the kind of join changes the answer.

And the column is only half of it. In PostgreSQL an aggregate over an empty set is null, so `SUM` of a non-nullable column, straight off the main table, still comes back null when the query matches no rows. `COUNT` is the exception that returns `0`.

So most helpers here default to a nullable result when given a column, and always offer an overload that lets you state the type explicitly. Use it when you're positive the query cannot produce null:

```ts
sum(table.column) // SQL<number | null>
sum<number>(table.column) // SQL<number>
```

Deferring to the caller is not an invention of this kit: it's the same escape hatch Drizzle already offers through the generic parameter on `sql`, applied where inference genuinely cannot reach.

## Retyping Drizzle's helpers

A part of this package does nothing but override the signatures of helpers Drizzle already ships. Its comparison helpers and other predicates aren't typed to return a boolean, so they land on the default `SQL<unknown>`.

That leaks. Passing one into a more strongly typed helper — say `filterWhere` on an aggregate — fails unless you cast at every call site:

```
Argument of type 'SQL<unknown>' is not assignable to parameter of type 'Expression<boolean>'.
```

Rather than sprinkle `as SQL<boolean>` everywhere, [`src/comparison.ts`](src/comparison.ts) and [`src/logical.ts`](src/logical.ts) declare module augmentations that give those functions the return types they should have. Importing this kit is enough to pick them up:

```ts
count(books.id).filterWhere(eq(books.authorId, authors.id))
```

## Testing

The tests here assert on two things only: the SQL string a helper builds, and how its decoder maps a raw driver value back to JS. Nothing ever reaches a database, so nothing confirms that PostgreSQL accepts the SQL or returns what the decoder expects.

That was fine in the original project, where these utilities were covered indirectly by the tests of the code that consumed them, against a real database. Extracted on its own, the kit has no such backstop. Running the helpers against a disposable PostgreSQL instance — [Testcontainers](https://testcontainers.com/) is the obvious way — would close that gap and is the first thing worth adding.

## Status

This really ought to live inside `drizzle-orm` rather than beside it. There it could use the internal types directly, and if those types changed, the helpers would be updated along with them.

I did try: a few small pull requests upstream, with parts of this effort, hoping to contribute more of it if they landed. They didn't go anywhere — the team's focus was elsewhere at the time. So the toolkit kept growing in parallel, as an internal thing.

This repo exists to put it somewhere visible. It isn't published to npm, and I'm not offering support or aiming for exhaustive coverage. It's a record of an idea I thought was worth keeping, and if it eventually finds its way to the Drizzle folks, it might give them ideas.

What is here grew by need: a fair slice of PostgreSQL, nowhere near all of it, and nothing for other engines. So treat it as a seed rather than a package. Lift the parts you want into your own codebase — `lib.ts` first, since everything else is built on that vocabulary — and grow your own helpers from there.

## Development

```sh
npm install
npm run typecheck
npm test
npm run format
```
