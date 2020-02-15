import { GraphQLModule } from '@graphql-modules/core'
import { gql, SchemaDirectiveVisitor, AuthenticationError } from 'apollo-server'
import { defaultFieldResolver } from 'graphql'
import Role from '../../utils/role'

class AuthDirective extends SchemaDirectiveVisitor {
  public visitObject(type) {
    this.ensureFieldsWrapped(type)
    type._requiredAuthRole = this.args.requires
  }

  public visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType)
    field._requiredAuthRole = this.args.requires
  }

  public ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) {
      return
    }
    objectType._authFieldsWrapped = true

    const fields = objectType.getFields()

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field
      field.resolve = async function(...args) {
        const roles = field._requiredAuthRole || objectType._requiredAuthRole
        if (!roles) {
          return resolve.apply(this, args)
        }
        const context = args[2]
        const { user } = context.req.session
        console.log(
          `[AuthDirective] fieldName: ${fieldName}, roles = ${roles.join(':')}, user = ${JSON.stringify(user)}`
        )
        if (!user || !roles.includes(user.role)) {
          throw new AuthenticationError('no permission')
        }
        return resolve.apply(this, args)
      }
    })
  }
}

module.exports = new GraphQLModule({
  typeDefs: gql`
    enum Role {
      admin
      viewer
    }
  
    directive @auth(requires: [Role]) on OBJECT | FIELD_DEFINITION
  `,
  resolvers: {
    Role: {
      admin: Role.admin,
      viewer: Role.viewer
    }
  },
  schemaDirectives: { auth: AuthDirective }
})
