import type { Collection, SchemaWithId, ExtendCollection, Context } from 'aeria'
import { file as originalFile, tempFile as originalTempFile, user as originalUser, get, getAll, insert, remove, removeAll } from 'aeria'

//File
export declare type fileCollection = ExtendCollection<typeof originalFile, {
	description: {
		$id: "file",
		properties: {

		}
	}
}>
export declare const file: fileCollection & { item: SchemaWithId<fileCollection["description"]> }
export declare type File = SchemaWithId<typeof file.description>
export declare const extendFileCollection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof file["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof file, TCollection>

//TempFile
export declare type tempFileCollection = ExtendCollection<typeof originalTempFile, {
	description: {
		$id: "tempFile",
		properties: {

		}
	}
}>
export declare const tempFile: tempFileCollection & { item: SchemaWithId<tempFileCollection["description"]> }
export declare type TempFile = SchemaWithId<typeof tempFile.description>
export declare const extendTempFileCollection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof tempFile["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof tempFile, TCollection>

//User
export declare type userCollection = ExtendCollection<typeof originalUser, {
	description: {
		$id: "user",
		properties: {

		}
	}
}>
export declare const user: userCollection & { item: SchemaWithId<userCollection["description"]> }
export declare type User = SchemaWithId<typeof user.description>
export declare const extendUserCollection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof user["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof user, TCollection>

//Animal
export declare type animalCollection = {
	description: {
		$id: "animal",
		properties: {
			name: {
				type: "string"
			},
			specie: {
				enum: [
					"dog",
					"cat",
				]
			},
			details: {
				type: "object",
				properties: {
					age: {
						type: "number",
						minimum: 10
					},
					dates: {
						type: "array",
						items: {
							type: "string",
							format: "date"
						}
					}
				}
			}
		}
	},
	functions: {
		get: typeof get,
		getAll: typeof getAll,
		insert: typeof insert,
		remove: typeof remove,
		removeAll: typeof removeAll,
		custom: () => never
	}
}
export declare const animal: animalCollection & { item: SchemaWithId<animalCollection["description"]> }
export declare type Animal = SchemaWithId<typeof animal.description>
export declare const extendAnimalCollection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof animal["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof animal, TCollection>

//Pet
export declare type petCollection = {
	description: {
		$id: "pet",
		properties: {

		}
	}
}
export declare const pet: petCollection & { item: SchemaWithId<petCollection["description"]> }
export declare type Pet = SchemaWithId<typeof pet.description>
export declare const extendPetCollection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof pet["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof pet, TCollection>
