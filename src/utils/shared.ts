// 清除值为空的对象属性
export function compactObj (obj: object) {
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (value === '' || value === null || value === undefined) {
      delete obj[key]
    }
  })
  return obj
}

// 转义特殊符号
export function escapeChar (char: string) {
  if (!char) return ''
  return char.trim().replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, '\\$1')
}

export function isNumber (value: any) {
  return typeof value === 'number'
}
