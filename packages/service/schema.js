const Joi = require('joi');

const loginSchema = Joi.object({
  id: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': '아이디는 8자 이상의 영문 대소문자와 숫자로 이루어져야 합니다.',
      'any.required': '아이디는 필수 입력 항목입니다.'
    }),
  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': '비밀번호는 8자 이상의 영문 대소문자와 숫자로 이루어져야 합니다.',
      'any.required': '비밀번호는 필수 입력 항목입니다.'
    }),
});
//.pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$'))
//'string.pattern.base': '비밀번호는 최소 8자 이상이어야 하며, 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.',


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