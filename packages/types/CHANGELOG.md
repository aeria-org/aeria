# @aeriajs/types

## 0.0.21

### Patch Changes

- f30669a: Fix log pollution when NODE_ENV=development

## 0.0.20

### Patch Changes

- 5dd9750: Updates `InsertPayload<T>` to require whole document when "\_id" property is absent.
  In Aeria, creation and update inserts are differed only by the presence or absence of the "\_id" property. If the "\_id" property is there, it means the insert operation updates the targeted document, and a partial document may be passed. Otherwhise `insert` expects the whole document to be passed.

  The `insert` function, however, would accept partial documents for both creation and update inserts, making code prone to runtime errors.

  ***

  ```typescript
  type Person = {
    name: string;
    age: number;
  };
  ```

  Valid:

  ```typescript
  // Valid creation
  context.collections.person.functions.insert({
    what: {
      name: "Terry",
      age: 50,
    },
  });

  // Valid update
  context.collections.person.functions.insert({
    what: {
      _id: new ObjectId("..."),
      name: "Terry",
    },
  });
  ```

  Invalid (from now on):

  ```typescript
  // Property 'age' is missing in type '{ name: string; }' but required in type
  // 'Omit<PackReferences<SchemaWithId<{ readonly $id: "person"; readonly
  // properties: { readonly name: { readonly type: "string"; }; readonly age:
  // number; } & { ...; }>>, "_id">'.
  context.collections.person.functions.insert({
    what: {
      name: "Terry",
    },
  });
  ```

## 0.0.19

### Patch Changes

- Normalize ACErrors

## 0.0.18

### Patch Changes

- Major types refactoring

## 0.0.17

### Patch Changes

- Allow explicitly annotate insert() return

## 0.0.16

### Patch Changes

- Add default to roles to ContractWithRoles

## 0.0.15

### Patch Changes

- Fix zeroes not being returned from routes

## 0.0.14

### Patch Changes

- Updates

## 0.0.13

### Patch Changes

- Multiple fixes

## 0.0.12

### Patch Changes

- Fix types bug

## 0.0.11

### Patch Changes

- Fix function types

## 0.0.10

### Patch Changes

- Fix types

## 0.0.9

### Patch Changes

- Fix types

## 0.0.8

### Patch Changes

- Fix Filters<T> type

## 0.0.7

### Patch Changes

- Refactor file structure

## 0.0.6

### Patch Changes

- Stricter typing in defineCollection()

## 0.0.5

### Patch Changes

- Fix context and SDK types

## 0.0.4

### Patch Changes

- Provide separate types for validation errors

## 0.0.3

### Patch Changes

- Remove unused deps from dependency tree

## 0.0.2

### Patch Changes

- Drop uneeded dependencies

## 0.0.1

### Patch Changes

- Fix inference of schemas with dynamic required properties
