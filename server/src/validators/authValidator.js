import Joi from "joi";

const signupSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string()
		.valid(...VALID_ROLES)
		.required(),
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});


export {
     signupSchema,
     loginSchema
};

