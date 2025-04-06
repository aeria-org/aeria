# @aeriajs/types

## 0.0.121

### Patch Changes

- 0164494: Refactor `getAll()` and `unpaginatedGetAll()`

## 0.0.120

### Patch Changes

- 532b7ef: Add `.context()` and `paginatedGetAll()`

## 0.0.119

### Patch Changes

- 1c38130: Add token revalidation on each request

## 0.0.118

### Patch Changes

- d021960: Fix `removeAll()` bug

## 0.0.117

### Patch Changes

- 141be55: Fix `InferProperties<T>`

## 0.0.116

### Patch Changes

- 867e98e: Add `enableLogging` option

## 0.0.115

### Patch Changes

- 158a285: Fix `context.token.userinfo` type

## 0.0.114

### Patch Changes

- 1cf4c60: Fix `description.preferred` type
- aef831a: Fix validation error type inconsistencies
- ce2675a: Fix user creation not possible when `config.security.rolesHierachy` is not set

## 0.0.113

### Patch Changes

- 6829254: Add role hierarchy system

## 0.0.112

### Patch Changes

- f2aa539: Increase presets type-safety

## 0.0.111

### Patch Changes

- 93d0d8c: add rules to strengthen security of user insert
- e822290: Remove `phone_number` from required fields of account creation

## 0.0.110

### Patch Changes

- d0e99ac: Add `objectid` format for strings
- 45861ce: Stringify ObjectIds sent over HTTP

## 0.0.109

### Patch Changes

- 8ebce21: "feat: add redefine password feature and change tokens to jwt"

## 0.0.108

### Patch Changes

- 828e314: Add `upload()` function to SDK

## 0.0.107

### Patch Changes

- dd5f2f7: Release

## 0.0.106

### Patch Changes

- 6f77491: Test build
- ca70f5b: Fix handling of nested structure inside reference

## 0.0.105

### Patch Changes

- 1b7fde1: Stricter `Filters<T>`

## 0.0.104

### Patch Changes

- 9e08aae: Refactor `additionalProperties`

## 0.0.103

### Patch Changes

- f4c23bc: Fix esm bundling

## 0.0.102

### Patch Changes

- f4ea0ae: Fix user picture getter

## 0.0.101

### Patch Changes

- 2d9d199: Replace `allowInsecureOperators` by RegExp escaping

## 0.0.100

### Patch Changes

- b895944: Re-export `functionSchemas` as an object

## 0.0.99

### Patch Changes

- 8d6f221: Add function schemas

## 0.0.98

### Patch Changes

- 64b5ebc: Add `allowInsecureOperators`

## 0.0.97

### Patch Changes

- 1c7196a: Secure against forbidden operators

## 0.0.96

### Patch Changes

- 7a0ebe6: Keep tempIds in insert payload

## 0.0.95

### Patch Changes

- 4f9f9dc: Fix cascading remove

## 0.0.94

### Patch Changes

- bfb991f: Release

## 0.0.93

### Patch Changes

- 3df5e0c: Save missing values as `null` in `insert()`

## 0.0.92

### Patch Changes

- a29e033: Fix `Condition<T>`

## 0.0.91

### Patch Changes

- 621b169: Fix port config

## 0.0.90

### Patch Changes

- b498dbd: Refactor endpoint errors

## 0.0.89

### Patch Changes

- 2b740eb: Return `get()` error instead of throwing in `insert()`

## 0.0.88

### Patch Changes

- 9ce72a1: Fix `Context`

## 0.0.87

### Patch Changes

- ad785f9: Release

## 0.0.86

### Patch Changes

- e8db177: Release

## 0.0.85

### Patch Changes

- 15e80a4: Release

## 0.0.84

### Patch Changes

- e671856: Refactor types

## 0.0.83

### Patch Changes

- 2368ce7: Refactor types

## 0.0.82

### Patch Changes

- 62bd5f1: Release

## 0.0.81

### Patch Changes

- ba8c59f: Safer handle of hidden properties and allow context in getters

## 0.0.80

### Patch Changes

- daa10bb: Refactor handling of Windows path separators

## 0.0.79

### Patch Changes

- dbf9065: Unpack nested types

## 0.0.78

### Patch Changes

- 30479ff: Export `insertUser()` function

## 0.0.77

### Patch Changes

- 4f4d31e: Fix endpoint error handling

## 0.0.76

### Patch Changes

- 6eac998: Fix autopopulate depth

## 0.0.75

### Patch Changes

- 072270d: Refactor validation and references

## 0.0.74

### Patch Changes

- f8e3c41: Collection middlewares, fix authentication bug

## 0.0.73

### Patch Changes

- d19bd76: Add `description.hidden`

## 0.0.72

### Patch Changes

- 5d30efa: Refactor type

## 0.0.71

### Patch Changes

- b15285d: Refactor actions

## 0.0.70

### Patch Changes

- e0f5922: Fix `WithACErrors<T>` narrowing

## 0.0.69

### Patch Changes

- a052067: Update aeria-lang

## 0.0.68

### Patch Changes

- 51638c5: Fix `traverseDocument()` incorrect error handling

## 0.0.67

### Patch Changes

- 55a61de: Prevent union expansion in `Projection<T>`

## 0.0.66

### Patch Changes

- ba7acc0: Add `PaginatedGetAllReturnType<T>`

## 0.0.65

### Patch Changes

- 29e6db7: Fix filter types and getAll return type

## 0.0.64

### Patch Changes

- 4d43509: `getActivationLink()`

## 0.0.63

### Patch Changes

- 3e209c3: Fix `get` returning random document if a filter containing `undefined` is provided

## 0.0.62

### Patch Changes

- de0523c: Fix custom function inference, allow `null` and `undefined` in `ConstProperty`

## 0.0.61

### Patch Changes

- df29aa6: Export `Result` in `@aeriajs/types`

## 0.0.60

### Patch Changes

- d4855b1: Fix function signatures

## 0.0.59

### Patch Changes

- 5bc9c5a: Fix endpoint error schemas

## 0.0.58

### Patch Changes

- ebe7477: Fix `FixedObjectProperty` type

## 0.0.57

### Patch Changes

- ec235f7: Fix pagination and function signatures

## 0.0.56

### Patch Changes

- fafac8a: Introduce `Result`

## 0.0.55

### Patch Changes

- d9008db: Add `roles` property in `CollectionAction<T>`

## 0.0.54

### Patch Changes

- d53ae6f: Fix minor bugs

## 0.0.53

### Patch Changes

- da3d1a1: Fix `insert()` invalid signature
- 3149b04: Add `ExtractError<T>` and return error instead of left in endpoint functions

## 0.0.52

### Patch Changes

- f650bda: Increase consistency of HTTP responses
- b7fc3ea: Error responses

## 0.0.51

### Patch Changes

- fcd8537: Refactor errors
- c28cae9: Fix type bugs

## 0.0.50

### Patch Changes

- 41fb322: Release

## 0.0.49

### Patch Changes

- fcfe0f5: Release

## 0.0.48

### Patch Changes

- 335d064: New `error()` and `isError()` functions

## 0.0.47

### Patch Changes

- b2692e2: Release

## 0.0.46

### Patch Changes

- 31e3709: Prefer `unknown` over `any`

## 0.0.45

### Patch Changes

- 4514037: Add `CollectionItemWithId<T>` auxilliary type'

## 0.0.44

### Patch Changes

- 79c9831: Add `CollectionItem<T>` auxilliary type

## 0.0.43

### Patch Changes

- 2c7001e: Bug fixes

## 0.0.42

### Patch Changes

- f1ce719: Refactor Access Control API

## 0.0.41

### Patch Changes

- 1e1f03e: Remove function attributes

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
