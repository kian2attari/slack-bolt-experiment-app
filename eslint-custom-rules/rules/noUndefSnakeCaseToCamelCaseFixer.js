/**
 * Rule to flag references to undeclared variables and offer to fix them if they seem to be
 * a consequence of the snake_case to camelCase migration
 *
 * @author Kian Attari
 */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks if the given node is the argument of a typeof operator.
 *
 * @param {ASTNode} node The AST node being checked.
 * @returns {boolean} Whether or not the node is the argument of a typeof operator.
 */
function hasTypeOfOperator(node) {
  const {parent} = node;

  return parent.type === 'UnaryExpression' && parent.operator === 'typeof';
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

exports.noUndefSnakeCaseToCamelCaseFixer = {
  meta: {
    type: 'problem',

    docs: {
      description:
        'companion to camelCase fixer for catching leftovers from the conversion that are now undefined',
      category: 'Stylistic Issues',
      recommended: false,
      url: 'https://github.com/kian2attari/eslint_camelCase_with_fixer',
    },

    fixable: 'code',

    schema: [
      {
        type: 'object',
        properties: {
          typeof: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      undef: "'{{name}}' is not defined.",
    },
  },

  create(context) {
    const options = context.options[0];
    const considerTypeOf = (options && options.typeof === true) || false;

    return {
      'Program:exit': function (/* node */) {
        const globalScope = context.getScope();

        globalScope.through.forEach(ref => {
          const {identifier} = ref;

          if (!considerTypeOf && hasTypeOfOperator(identifier)) {
            return;
          }

          context.report({
            node: identifier,
            messageId: 'undef',
            data: identifier,
            fix(fixer) {
              const camelCased = identifier.name.replace(/([-_][a-z])/g, group =>
                group.toUpperCase().replace('_', '')
              );
              return fixer.replaceText(identifier, camelCased);
            },
            suggest: [
              {
                desc: 'Change the identifier to camelcase',
                fix(fixer) {
                  const camelCased = identifier.name.replace(/([-_][a-z])/g, group =>
                    group.toUpperCase().replace('_', '')
                  );
                  return fixer.replaceText(identifier, camelCased);
                },
              },
            ],
          });
        });
      },
    };
  },
};
