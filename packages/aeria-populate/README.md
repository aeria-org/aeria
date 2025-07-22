# `aeria-populate`

## Usage

- `--compileMarkdown/-c`: will compile Markdown to HTML before inserting
- `--dropCollections/-d`: will drop matching collections before inserting
- `--watch/-w`: watch mode (can not be used together with `--drop-collections`)

```sh
# when --env-file is applicable
node --env-file .env node_modules/aeria-populate/bin/index.js "content/**/*.md"

# otherwise
npx aeria-populate "content/**/*.md"
npx aeria-populate -c "content/**/*.md"
```

## Frontmatter format

```md
---
collection: person
unique: slug
content: description
document:
    slug: john-doe
    sex: male
---

# John Doe

This will be inserted in the `description` property...
```

