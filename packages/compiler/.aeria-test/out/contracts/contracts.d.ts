export declare const GetPersonContract: {
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
		{
			type: "object",
			properties: {
				_tag: {
					const: "Error"
				},
				error: {
					type: "object",
					properties: {
						name: {
							type: "string"
						}
					}
				},
				result: {
					const: undefined
				}
			}
		},
		{
			type: "object",
			properties: {
				_tag: {
					const: "Result"
				},
				error: {
					const: undefined
				},
				result: {
					type: "object",
					properties: {
						name: {
							type: "string"
						},
						age: {
							type: "number"
						}
					}
				}
			}
		},
		{
			type: "string"
		},
	]
}