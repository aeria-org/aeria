# `@aeriajs/security`

## Introduction

This package implements common security checks.
The checks can be used separatelly, or through a function called `useSecurity()`. This function returns an object with two functions:

- `beforeRead()`: checks to be made before reading data
- `beforeWrite()`: checks to be made before writing data

## References

- `checkOwnershipRead()` and `checkOwnershipWrite()`: [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html), [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- `checkImmutability()`: [CWE-471: Modification of Assumed-Immutable Data (MAID)](https://cwe.mitre.org/data/definitions/471.html )
- `checkPagination()`: [CWE-770: Allocation of Resources Without Limits or Throttling](https://cwe.mitre.org/data/definitions/770.html)
- `rateLimiting()`: [CWE-799: Improper Control of Interaction Frequency](https://cwe.mitre.org/data/definitions/799.html)

