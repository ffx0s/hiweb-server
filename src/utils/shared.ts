import crypto from 'crypto'

/**
 * 清除值为空的对象属性
 * @param obj 对象
 */
export function compactObj (obj: object) {
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (value === '' || value === null || value === undefined) {
      delete obj[key]
    }
  })
  return obj
}

/**
 * 转义特殊符号
 * @param char 字符串
 */
export function escapeChar (char: string) {
  if (!char) return ''
  return char.trim().replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, '\\$1')
}

/**
 * 目标是否为数字类型
 * @param value 目标
 */
export function isNumber (value: any) {
  return typeof value === 'number'
}

/**
 * 位数补 0
 * @param num 目标
 * @param length 位数 
 */
export function prefixInteger(num: number|string, length: number) {
  return (Array(length).join('0') + num).slice(-length)
}

/**
 * MD5 计算
 * @param value 目标
 */
export function MD5 (value: string) {
  return crypto
    .createHash('md5')
    .update(value)
    .digest('hex')
}