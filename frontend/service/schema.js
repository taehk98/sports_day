const Joi = require('joi');

const loginSchema = Joi.object({
  id: Joi.string().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,}$')).required()
});

const eventSchema = Joi.object({
  eventName: Joi.string().pattern(new RegExp('^[a-zA-Z0-9가-힣 ]+$')).required(),
  created: Joi.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).required(),
  modified: Joi.alternatives().try(
      Joi.string().valid('없음'), // Validating for '없음'
      Joi.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).required() // Validating for yyyy/mm/dd format
    ).required()
});

const teamNameSchema = Joi.string().pattern(new RegExp('^[a-zA-Z0-9가-힣 ]+$')).required();

module.exports = { loginSchema, eventSchema, teamNameSchema };