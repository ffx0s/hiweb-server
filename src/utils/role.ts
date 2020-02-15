enum Role {
  viewer,
  admin
}

export function isAdmin (role: number) {
  return role === Role.admin
}

export default Role
