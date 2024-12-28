export declare const GetPersonContract: {
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
}