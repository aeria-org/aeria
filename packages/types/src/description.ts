import type { WithId } from 'mongodb'
import type { PhosphorIcon } from '@phosphor-icons/core'
import type { Condition } from './condition.js'
import type { JsonSchema, PropertiesWithId } from './property.js'
import type { OwnershipMode } from './security.js'

export type DescriptionPreset =
  | 'crud'
  | 'duplicate'
  | 'remove'
  | 'removeAll'
  | 'owned'
  | 'timestamped'
  | 'view'

export type Icon = PhosphorIcon['name']

export type CollectionActionRoute = {
  route: {
    name: string
    setItem?: boolean
    fetchItem?: boolean
    clearItem?: boolean
    params?: Record<string, any>
    query?: Record<string, any>
  }
}

export type CollectionActionFunction = {
  function?: string
  selection?: boolean
  effect?: string
}

export type CollectionActionEvent = {
  event?: string
}

export type CollectionActionBase<TDescription extends Description> = {
  label?: string
  icon?: Icon
  ask?: boolean
  button?: boolean
  translate?: boolean
  roles?: readonly string[]
  requires?: readonly PropertiesWithId<TDescription>[]
}

export type CollectionAction<TDescription extends Description> = CollectionActionBase<TDescription> & (
  | CollectionActionRoute
  | CollectionActionFunction
  | CollectionActionEvent
)

export type CollectionActions<TDescription extends Description> =
  Record<string, null | CollectionAction<TDescription>>

export type FormLayout<TDescription extends Description> = {
  fields?: Partial<Record<PropertiesWithId<TDescription>, FormLayoutField<TDescription>>>
}

export type FormLayoutField<TDescription extends Description> = {
  span?: number
  verticalSpacing?: number
  separator?:
    | true
    | 'top'
    | 'bottom'
  if?: Condition<TDescription>
  component?: {
    name: string
    props?: Record<string, any>
  }
}

export type TableLayoutAction<TDescription extends Description> = {
  button?: boolean | Condition<TDescription>
  if?: Condition<TDescription>
}

export type TableLayout<TDescription extends Description> = {
  actions?: Partial<
    Record<
      keyof TDescription['individualActions'],
      TableLayoutAction<TDescription>
    >
  >
}

export type FiltersPreset<TDescription extends Description> = {
  label?: string
  icon?: Icon
  filters?: Partial<Record<PropertiesWithId<TDescription> | `$${string}`, any>>
  table?: readonly PropertiesWithId<TDescription>[]
  badgeFunction?: string
  default?: boolean
}

export type LayoutName =
  | 'tabular'
  | 'grid'
  | 'list'

export type LayoutOptions<TDescription extends Description = any> = {
  title?: PropertiesWithId<TDescription>
  picture?: PropertiesWithId<TDescription>
  badge?: PropertiesWithId<TDescription>
  information?: PropertiesWithId<TDescription>
  active?: PropertiesWithId<TDescription>
  translateBadge?: boolean
}

export type Layout<TDescription extends Description = any> = {
  name: LayoutName
  options?: LayoutOptions<TDescription>
}

export type SearchOptions<TDescription extends Description> = {
  indexes: readonly (keyof TDescription['properties'])[]
  placeholder?: string
  exactMatches?: boolean
}

export type RuntimeDescription<TDescription extends Description = any> = Pick<
  TDescription,
  | 'actions'
  | 'individualActions'
  | 'filters'
  | 'filtersPresets'
  | 'layout'
  | 'table'
  | 'tableMeta'
  | 'form'
  | 'tableLayout'
  | 'formLayout'
>

export type Description<TDescription extends Description = any> = JsonSchema<TDescription> & {
  // unused
  title?: string
  categories?: readonly string[]

  hidden?: boolean
  preferred?: Record<string, RuntimeDescription<TDescription>>

  icon?: Icon
  indexes?: readonly PropertiesWithId<TDescription>[]
  defaults?: Record<string, any>

  // modifiers
  owned?: OwnershipMode
  temporary?: {
    index: keyof TDescription['properties']
    expireAfterSeconds: number
  }
  timestamps?: false
  immutable?:
    | boolean
    | readonly (keyof TDescription['properties'])[]
    | ((doc: WithId<any>)=> boolean | Promise<boolean>)

  // takes an array of something
  route?: readonly string[]
  presets?: readonly DescriptionPreset[]

  table?: readonly PropertiesWithId<TDescription>[]
  tableMeta?: readonly PropertiesWithId<TDescription>[]

  filtersPresets?: Record<string, FiltersPreset<TDescription>>
  freshItem?: Partial<Record<PropertiesWithId<TDescription>, unknown>>

  form?: readonly PropertiesWithId<TDescription>[] | Record<PropertiesWithId<TDescription>, string[]>
  writable?: readonly PropertiesWithId<TDescription>[]
  filters?: readonly (
    PropertiesWithId<TDescription> | {
      property: PropertiesWithId<TDescription>
      default: string
    }
  )[]
  layout?: Layout<TDescription>
  formLayout?: Partial<FormLayout<TDescription>>
  tableLayout?: Partial<TableLayout<TDescription>>

  // actions
  actions?: CollectionActions<TDescription>
  individualActions?: CollectionActions<TDescription>

  search?: SearchOptions<TDescription>
}

