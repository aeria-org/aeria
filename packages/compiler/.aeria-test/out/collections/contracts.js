import { defineContract } from 'aeria'

export const GetPersonContract = defineContract({
	payload: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			pet: {
				$ref: "Pet"
			}
		}
	},
	response: [
		{
			type: "object",
			properties: {
				name: {
					type: "string"
				}
			}
		},
		{
			type: "object",
			properties: {
				name: {
					type: "string"
				},
				age: {
					type: "number"
				}
			}
		},
		{
			type: "string"
		}
	]
})