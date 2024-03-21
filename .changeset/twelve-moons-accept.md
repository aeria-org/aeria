---
"@aeriajs/types": patch
---

Updates `InsertPayload<T>` to require whole document when "\_id" property is absent.
In Aeria, creation and update inserts are differed only by the presence or absence of the "\_id" property. If the "\_id" property is there, it means the insert operation updates the targeted document, and a partial document may be passed. Otherwhise `insert` expects the whole document to be passed.

The `insert` function, however, would accept partial documents for both creation and update inserts, making code prone to runtime errors.

---

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

