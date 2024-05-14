# @aeriajs/types

## 0.0.40

### Patch Changes

- d2da9ea: New access control API

## 0.0.39

### Patch Changes

- 1cf004c: Bump versions

## 0.0.38

### Patch Changes

- Bump versions

## 0.0.37

### Patch Changes

- b3d1a4c: Disable esModuleInterop

## 0.0.36

### Patch Changes

- 40e00d8: Add `maskedValue` property

## 0.0.35

### Patch Changes

- 1802694: Release changes

## 0.0.34

### Patch Changes

- 2e0aa5c: Minor adjustments

## 0.0.33

### Patch Changes

- 3d878da: Revalidate token

## 0.0.32

### Patch Changes

- 49dda78: Refactor `CollectionSecurityPolicy`
- 3c24db0: Refactor types
- bd37b27: Rename packages

## 0.0.31

### Patch Changes

- 32a06cd: Add "on-write" ownership mode, refactor types

## 0.0.30

### Patch Changes

- 254a8aa: Refactor: rename apiBase -> baseUrl and apiUrl -> publicUrl
- 34753d9: Update

## 0.0.29

### Patch Changes

- 50e5230: Fix integer inference, rename file properties

## 0.0.28

### Patch Changes

- 1a99762: Fix inference of array of objects in contract responses
- 898406d: Several minor fixes, fix rate limiting

## 0.0.27

### Patch Changes

- 7d5f041: Improve function inference in defineCollection, better warmup summary, apiBase

## 0.0.26

### Patch Changes

- b90cb06: Add RegexCondition, fix minor bugs

## 0.0.25

### Patch Changes

- e04358b: Remove @phosphor-icons/core peer dependency
- bb052f0: Remove `@phosphor-icons/core` peer dependency

## 0.0.24

### Patch Changes

- e57cdfd: Add @phosphor-icons/core as a peer dependency

## 0.0.23

### Patch Changes

- 7496717: Bump packages

## 0.0.22

### Patch Changes

- adf95a0: Bump versions

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
