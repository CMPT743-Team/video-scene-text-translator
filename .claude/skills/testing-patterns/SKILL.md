---
name: testing-patterns
description: TDD testing patterns and best practices. Loads when writing, editing, or debugging test files. Use when creating new tests, fixing failing tests, or improving test coverage.
---

## TDD Cycle
1. Write a failing test that describes the expected behavior.
2. Write the minimum code to make the test pass.
3. Refactor while keeping tests green. Never skip this step — skipping refactoring is the most common TDD failure (Martin Fowler).

## Test Sequencing
Order tests to drive design decisions, not just coverage:
1. Start with the simplest meaningful case (happy path).
2. Add one constraint per test — each test should force one design decision.
3. Save edge cases for after core behavior is solid.
Bad sequencing: writing all edge cases before core behavior works.

## Test Structure
Use the Arrange-Act-Assert pattern for every test:

```
// Arrange — set up test data and dependencies
// Act — call the function under test
// Assert — verify the result
```

## Naming
Name tests as: "[function] should [expected behavior] when [condition]"
Example: "createUser should return error when email is invalid"

## What to Test
- Happy path — the expected success case
- Edge cases — empty input, null, undefined, boundary values
- Error cases — invalid input, network failures, missing permissions
- State transitions — before and after the operation

## What NOT to Test
- Implementation details — test behavior, not how it's done
- Third-party libraries — mock them, don't test them
- Trivial code — simple getters/setters don't need tests
- Framework-provided CRUD — trust the ORM, test your logic around it
- UI layout — TDD the business logic underneath, not the pixels

## When to Skip TDD (Still Write Tests)
- Exploratory/spike work — write code first, backfill tests once the approach solidifies
- Learning unfamiliar systems — use tests as exploration tools, not test-first discipline
- Legacy code — add tests incrementally around change points (Michael Feathers' approach)
- Throwaway demos — only add tests once you decide the concept is worth pursuing

## Listen to Your Tests
Difficult tests are design feedback, not testing problems:
- Excessive setup (many mocks) → code has too many responsibilities. Split it.
- Complicated test structure → code is too coupled. Decouple it.
- Hard-to-name tests → function does too much. Break it apart.
- Brittle tests that break on refactor → testing implementation, not behavior. Rewrite them.

## Anti-Patterns to Avoid
- The Liar — test passes but doesn't verify the intended behavior (e.g., missing await on async code)
- The Giant — too many assertions in one test. Each test should verify one behavior.
- Excessive Setup — 10+ mocks to test one function means the code needs refactoring, not more mocks.
- The Slow Poke — slow tests stop getting run. Keep unit tests fast; mock external deps.
- Evergreen tests — tests written after code that never fail. You must see the test fail first.

## Test Granularity
Don't blindly follow the test pyramid. Ask: "Does this test verify a meaningful responsibility?"
- Isolated unit tests are fast but fragile during refactoring.
- Integrated tests verify real behavior but run slower.
- Start with integration tests for critical paths, drill down to unit tests when speed matters.
- Test at one abstraction level above the code — not too close (brittle) or too far (vague).

## Mocking Rules
- Mock external dependencies (APIs, databases, file system)
- Never mock the module under test
- Prefer dependency injection over patching globals
- Reset mocks between tests to avoid shared state
- If you need too many mocks, your code is too coupled — refactor first

## Test Independence
- Each test must run in isolation — no dependency on execution order
- No shared mutable state between tests
- Each test sets up its own data and cleans up after itself

## Debugging Failing Tests
1. Read the error message and stack trace first.
2. Check if the test itself is wrong before blaming the code.
3. Add a minimal reproduction — strip the test to the simplest failing case.
4. Check for flaky causes: timing, shared state, environment differences.
