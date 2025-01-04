import { defineContract, errorSchema, resultSchema } from 'aeria'

export const GetPersonContract = defineContract({
	payload: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			pet: {
				$ref: "pet"
			}
		}
	},
	response: [
	errorSchema({
	type: "object",
	properties: {
		name: {
			type: "string"
		}
	}
}),
	resultSchema({
	type: "object",
	properties: {
		name: {
			type: "string"
		},
		age: {
			type: "number"
		}
	}
}),
	{
	type: "string"
},
]
})