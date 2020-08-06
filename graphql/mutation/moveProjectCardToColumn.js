exports.moveProjectCard = `
mutation moveProjectCard($card_id: ID!, $column_id: ID!) {
    moveProjectCard(input: {cardId: $card_id, columnId: $column_id}) {
      cardEdge {
        node {
          id
        }
      }
    }
  }
`;
