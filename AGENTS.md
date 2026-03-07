## Tanstack Query
- Prefer `queryOption/mutationOptions` over `useQuery/useMutation` when extracting common
- Use `useQuery` and `useMutation` only in the final UI component (screen or feature component) that needs to call the API, not in entities or shared hooks

## Typescript
- Prefer `type` over `interface`
- Never annotate return types of functions, let TS infer them
- After each bug or feature work, print percent of confidence of your changes with description why and what could be done differently.

## **Simplicity First**

**Minimum code that solves the problem. Nothing speculative.**

* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.

**Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.**
