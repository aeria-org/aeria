import { Result } from '@aeriajs/types'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
// import { generateCode } from './codegen.js'
import { analyze } from './semantic.js'

export const compile = async (input: string) => {
  const { error: tokenizeError, result: tokens } = tokenize(input)
  if(tokenizeError){
    console.log(tokenizeError)
    return Result.error(tokenizeError)
  }

  // console.log(JSON.stringify(tokens, null, 2))

  const result = parse(Array.from(tokens))
  console.log(JSON.stringify(result, null, 2))

  // if( error ) {
  //   return Result.error(error)
  // }
  //
  const r = await analyze(result.ast)
  console.log('---')
  console.log(JSON.stringify(r, null, 2))
  console.log('--- end')

  // return generateCode(ast)
}

const inputCode = `
collection File extends aeria.file {}
collection TempFile extends aeria.tempFile {}
collection User extends aeria.user {
  properties {
    name str
    email str
    business str
    phone_number str
    roles []enum @values([
      "root",
      "logistic",
      "support",
      "commercial",
      "producer",
      "callcenter"
    ])
  }
}

collection Ticket {}

collection Comment {
  owned "on-write"
  required {
    description
  }
  properties {
    ticket Ticket
    description str @element("textarea") 
    images []File @accept(["image/*"]) @maxItems(3)
    owner User @populate([name, email, roles])
    liked_by []User
  }
  functions {
    get @expose
    getAll @expose
    insert @expose
    remove @expose
    upload @expose
  }
  presets {
    crud
  }
}

collection Topic {
  owned "on-write"
  table {
   image
   system
   secret_key
   discord_channel_id
   link_url
  }
  search {
    placeholder "Insira o nome do sistema aqui"
    indexes {
      system
    }
  }
  required {
    system
    discord_channel_id
  }
  properties {
    system str
    discord_channel_id str
    secret_key str
    link_url str
    image File @accept(["image/*"])
  }
  functions {
    get @expose("unauthenticated")
    getAll @expose(true)
    insert @expose
    remove @expose
    upload @expose
  }
  presets {
    crud
  }
}

collection Ticket {
  owned "on-write"
  filters{
    title
    topic
    status
    priority
  } 
  search {
    placeholder "Pesquise aqui"
    indexes {
      title
    }
  }
  required {
    title
    topic 
    priority
    status
    description
    attached
  }
  table {
    title
    topic
    status
    priority
    created_at
    status_changed_by
  }
   form {
    title
    topic
    status
    priority
    description
    attached
    observation
  }
  properties {
    title str
    topic Topic @populate([image, discord_channel_id])
    status enum @values([
      "Ativo",
      "Reparando",
      "Resolvido"
    ] ) 
    status_changed_by User
    priority enum @values([
      "Baixa",
      "Moderada",
      "Urgente"
    ])
    description str @element("textarea")
    observation str @element("textarea")
    attached File @accept(["image/*"])
    created_at str @format("date-time")
    updated_at str @format("date-time")
    owner User @populate([name, email, roles, phone_number])
    comment Comment @populate([description, owner])
  }
  functions {
    count @expose
    get @expose
    getAll @expose
    insert @expose
    upload @expose
    remove @expose
  }
  presets {
    crud
  }
}

collection Broadcast {
  table {
    title
    system
  }
  search {
    placeholder "Insira o nome da transmissão aqui"
    indexes {
      title
    }
  }
  required {
    title
    system
    message 
  }
  properties {
    title str
    system Topic
    message str @element("textarea")
    picture File @accept(["image/*"])
  }
  functions {
    get @expose("unauthenticated")
    getAll @expose("unauthenticated")
    insert @expose
    remove @expose
    upload @expose
  }
  presets {
   crud
  }
}

collection  Contacts { 
   table {
    name
    organization
    email
    phone
  }
  filters{
    name
    email
    phone
    organization
  } 
  search {
    placeholder "Insira o nome, organização, telefone, do contato aqui"
    indexes {
      name
      phone
      email
      organization
    }
  }
  required {
    name
    organization
  }
  properties {
    name str
    organization str
    phone str @mask(["(##) ####-####"])
    email str
    details {
      properties {
        test User @indexes([xxz])
      }
    }
  }
  functions {
    get @expose("unauthenticated")
    getAll @expose(true)
    insert @expose
    remove @expose
    upload @expose
  }
  presets {
   crud
  }
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

