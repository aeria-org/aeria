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

collection Business {
  required {
    name
  }
  icon "suitcase"
  properties {
    name str
    picture File @accept(["image/*", "video/*"])
    default_phases []{
      properties {
        name str
        default_phase_steps []{
          properties{
            name str
            default_step_materials []{
              properties {
                name str
                unit str
              }
            }
          }
        }
      }
    }
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection User extends aeria.user {
  indexes {
    name
    document
  }
  form {
    name
    birthday
    document
    address
    bank_account
    business
  }
  properties {
    name str
    roles []enum @values([
      "root",
      "supervisor",
      "customer"
    ])
    email str
    phone_number str
    document str @mask(["###.###.###-##", "###.###.###/####-#"])
    birthday str @format("date")
    picture_file File @accept(["image/*"])
    address {
      properties {
        city str
        state str
        zipcode str @mask("#####-###")
        district str
        street str
        number str
        complement str
      }
    }
    bank_account {
      properties {
        institution str
        type enum @values(["poupança", "conta_corrente"])
        agency str
        account str
        pix_key str
      }
    }
    business Business @populate([name, picture])
  }
  search {
    placeholder "Pesquise um Usuário"
    indexes{
      name
      email
      document
    }
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
}

collection BillingUnit {
  icon "bank"
  indexes {
    name
  }
  required {
    name
    phone
    email
    document
    birthday
    bank_account
    address
  }
  properties {
    name str
    phone str
    email str
    document str @mask(["###.###.###-##", "###.###.###/####-#"])
    birthday str @format("date")
    bank_account {
      properties {
        institution str
        type enum @values(["poupança", "conta_corrente"])
        agency str
        account str
        pix_key str
      }
    }
    address {
      properties {
        city str
        state str
        zipcode str @mask("#####-###")
        district str
        street str
        number str
        complement str
      }
    }
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Supplier {
  icon "truck"
  indexes {
    name
  }
  required{
    name
  }
  properties {
    name str
    phone str
    email str
    document str @mask(["###.###.###-##", "###.###.###/####-#"])
    birthday str @format("date")
    address {
      properties {
        city str
        state str
        zipcode str @mask("#####-###")
        district str
        street str
        number str
        complement str
      }
    }
    bank_account {
      properties {
        institution str
        type enum @values(["poupança", "conta_corrente"])
        agency str
        account str
        pix_key str
      }
    }
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection ServiceProvider {
  icon "handshake"
  indexes {
    name
  }
  required{
    name
  }
  properties {
    name str
    phone str
    email str
    document str @mask(["###.###.###-##", "###.###.###/####-#"])
    birthday str @format("date")
    address {
      properties {
        city str
        state str
        zipcode str @mask("#####-###")
        district str
        street str
        number str
        complement str
      }
    }
    bank_account {
      properties {
        institution str
        type enum @values(["poupança", "conta_corrente"])
        agency str
        account str
        pix_key str
      }
    }
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Goal {
  icon "flag-banner"
  indexes {
    sale_goal
    profit_goal
  }
  required{
    year
    month
    sale_goal
    profit_goal
  }
  properties {
    year num
    month num
    sale_goal num
    profit_goal num
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Material {
  icon "wall"
  required {
    name
  }
  indexes {
    name
  }
  properties {
    name str
    unit str
    //suppliers []{
    //  properties {
    //    supplier Supplier
    //    price num
    //  }
    //}
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection StockItem {
  icon "toolbox"
  required {
    material
  }
  properties{
    detail str
    material Material @populate([name, unit])
    quantity num
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Step {
  icon "bookmark-simple"
  required{
    name
    status
  }
  properties {
    name str @minLength(10)
    stock []StockItem @inline(true)
    status enum @values(["pending", "completed", "canceled"])
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Phase {
  icon "bookmark"
  required{
    name
    steps
  }
  properties {
    name str
    steps []Step @inline
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Contract {
  icon "book-open-text"
  indexes {
    service_provider
  }
  properties{
    service str
    service_provider ServiceProvider
    billing_unit BillingUnit
    unit str
    number str
    quantity num
    unit_price num
    closures str
    observations str
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Message {
  icon "note-pencil"
  indexes {
    title
  }
  properties {
    title str
    text str
    user User
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Assignment {
  icon "alarm"
  indexes {
    name
  }
  required {
    name
  }
  properties{
    name str
    status enum @values(["pending", "complete"])
    users []User @populate([name, _id, picture_file, email])
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Day {
  icon "calendar"
  indexes {
    date
  }
  required {
    date
  }
  properties {
    date {
      properties {
        day num
        month num
        year num
      }
    }
    assignments []Assignment @inline @populate([name, status, users])
    pictures []File @accept(["image/*"]) 
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Construction {
  icon "buildings"
  indexes {
    name
  }
  required {
    name
    customer
  }
  table {
    name
    customer
    status
  }
  properties {
    contract Contract
    name str
    is_template bool
    from_template bool
    status enum @values(["pending_approval", "ongoing", "finished"]) //@translate(true)
    customer User @populate([phone_number, name])
    phases []Phase @inline
    address {
      properties {
        city str
        state str
        zipcode str @mask("#####-###")
        district str
        street str
        number str
        complement str
      }
    }
    cronogram  []Day @inline @populate([assignments, pictures])
    pictures []File @accept(["image/*"])
    messages []{
      properties {
        message Message
      }
    }
    materials []{
      properties {
        description str
        material Material
        quantity num
      }
    }
    services {
      properties {
        preliminary_and_general num @minimum(0) @maximum(100)
        infrastructure num @minimum(0) @maximum(100)
        superstructure num @minimum(0) @maximum(100)
        walls num @minimum(0) @maximum(100)
        frames num @minimum(0) @maximum(100)
        glasses_and_plastics num @minimum(0) @maximum(100)
        covers num @minimum(0) @maximum(100)
        impermeabilization num @minimum(0) @maximum(100)
        internal_coating num @minimum(0) @maximum(100)
        external_coating num @minimum(0) @maximum(100)
        lining num @minimum(0) @maximum(100)
        painting num @minimum(0) @maximum(100)
        floors num @minimum(0) @maximum(100)
        finish num @minimum(0) @maximum(100)
        electric_and_telephonic num @minimum(0) @maximum(100)
        hidraulic num @minimum(0) @maximum(100)
        sewer num @minimum(0) @maximum(100)
        metals num @minimum(0) @maximum(100)
        complements num @minimum(0) @maximum(100)
        other num @minimum(0) @maximum(100)
      }
    }
    execution {
      properties {
        incidence num
        item_execution num
        construction_execution num
      }
    }
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection PurchaseRequest {
  icon "hand-coins"
  required {
    construction
    material
    quantity
    status
  }
  properties {
    construction Construction
    material Material
    supplier Supplier
    quantity num
    unit_price num
    status enum @values(["pending", "approved", "refused"])
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}

collection Transaction {
  icon "receipt"
  indexes {
    type
  }
  required {
    type
    amount
    description
  }
  properties {
    person User
    construction Construction
    type enum @values(["credit", "debit", "to_pay", "to_recieve"])
    amount num
    description str
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
  filters {
    description
    person
    construction
  }
  search {
    placeholder "Pesquise aqui por descrição"
    indexes {
      description
    }
  }
}

collection Cotation {
  icon "money"
  indexes {
    customer
    construction
  }
  required {
    status
    customer
    service
  }
  properties {
    status enum @values(["pending", "approved", "refused"])
    customer User
    service enum @values(["construction", "laje"])
    construction Construction
    observations str //errors:@inputType("text")
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
    count @expose(["root", "supervisor", "customer"])
  }
  presets {
    crud
  }
}

collection ServiceOrder {
  icon "scroll"
  indexes {
    cotation
    start_of_execution
  }
  properties {
    start_of_execution str @format("date")
    cotation Cotation @populate([customer])
    status enum @values(["pending", "approved", "refused"])
    business Business
  }
  functions {
    get @expose(["root", "supervisor", "customer"])
    getAll @expose(["root", "supervisor", "customer"])
    insert @expose(["root", "supervisor"])
    upload @expose(["root", "supervisor"])
    remove @expose(["root", "supervisor"])
  }
  presets {
    crud
  }
}


`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

