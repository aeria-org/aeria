---
"@aeriajs/types": patch
---

Updates `InsertPayload<T>` to require whole document when "\_id" property is absent.
In Aeria, creation and update inserts are differed only by the presence or absence of the "\_id" property. If the "\_id" property is there, it means the insert operation updates the targeted document, and a partial document may be passed.
The `insert` function, however, would accept partial documents for both creation and update inserts.

---

```typescript
type Person = {
  name: string;
  age: number;
};
```

Valid:

```typescript
// creates
context.collections.person.insert({
  what: {
    name: "Terry",
    age: 50,
  },
});

// updates
context.collections.person.insert({
  what: {
    _id: new ObjectId("..."),
    name: "Terry",
  },
});
```

Invalid (from now on):

```typescript
// tries to create, but the required "age" property is missing
context.collections.person.insert({
  what: {
    name: "Terry",
  },
});
```
