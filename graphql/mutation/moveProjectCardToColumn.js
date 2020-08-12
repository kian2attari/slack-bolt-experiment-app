exports.moveProjectCard = `
mutation moveProjectCard($cardId: ID!, $columnId: ID!) {
    moveProjectCard(input: {cardId: $cardId, columnId: $columnId}) {
      cardEdge {
        node {
          id
        }
      }
    }
  }
`;
