// AI opponent for Chess. The Chess Sorceress only considers the current board state,
// and all currently available moves, but this is adequate for the current project.
const chessAI = {
    // Piece weights for AI usage (personal opinion and gut feelings, don't @ me)
    pieceWeight : {
        Pawn: 3,
        Rook: 15,
        Bishop: 14,
        Knight: 8,
        Queen: 20,
        // Killing the King wins the game. Maximum priority, but not cranked so high that the AI does really dumb things that will backfire
        King: 23
    },

    protectWeight : {
        Pawn: 2, // pawns do not really need to be defended. They do the defending, not the other way around!
        Rook: 10,
        Bishop: 9,
        Knight: 7,
        Queen: 15,
        King: 0 // Guarding implies retribution, but there can be no retribution after the king is slain
    },

    defensiveness: 6, // factor to apply towards preserving own pieces
    aggressiveness: 2, // factor to apply towards capturing enemy pieces vs merely threatening them
    maxRandom: 5,

    runAI: function() {

        let activePieces={
            White:0,
            Black:0
        }
        // Reset protection objects (needed for basic foresight)
        for (let i=0;i<board.aiPieces.length;i++) {
            if (board.aiPieces[i].active) {
                activePieces.Black += this.pieceWeight[board.aiPieces[i].type];
            }
        }
        for (let i=0;i<board.playerPieces.length;i++) {
            if (board.playerPieces[i].active) {
                activePieces.White += this.pieceWeight[board.playerPieces[i].type];
            }
        }

        // dynamically adjust weights to be less defensive and more aggressive when AI is winning
        let winning = ((activePieces.Black/activePieces.White)+3)/4;

        // list of all available moves. The task is to choose which of these is the best move.
        const availableMovesForAI = board.allThreatenedTiles('Black');
        const availableMovesForPlayer = board.allThreatenedTiles('White', false, true);


        let bestMove={
            index:-1,
            weight:-1000,
        };
        for (let i=0;i<availableMovesForAI.length;i++) {
            let testWeight = 0;
            let testMove = availableMovesForAI[i];

            // Is this move even valid? i.e. is there another black piece in the way?
            if (board.boardState[testMove[1]][testMove[2]] !== null && board.boardState[testMove[1]][testMove[2]].color==='Black') {
                continue;
            }

            // will this move put black into check?
            // This also returns a weight Object with information about that board state
            let weightObject={};
            if (!testMove[0].moveTo(null,testMove[2],testMove[1],false,true,weightObject)) {
                continue;
            }
            // console.log(weightObject);

            let randomNum = Math.max(0,Math.floor(Math.random() * Math.min(this.maxRandom,weightObject.whiteActive-4,weightObject.blackActive)));
            // console.log(randomNum);

            // Maximize available moves while minimizing the players moves
            // Also includes a random num to make it less predictable. Less random when fewer pieces remain though, for better optimized checkmating of the player.

            testWeight = weightObject.blackMoveNum - weightObject.whiteMoveNum + randomNum - testMove[0].lastMoved + board.turnNum;

            // Prioritize promoting pawns
            if (testMove[0].type==='Pawn' && (testMove[1]===0 || testMove[1] === 7 ) ) {
                testWeight += this.pieceWeight.Queen;
            }

            // Subtract the value for endangered pieces, multiplied by defensiveness
            for (let j=0;j<weightObject.blackInDanger.length;j++) {
                testWeight -= this.pieceWeight[weightObject.blackInDanger[j].type] * this.defensiveness / winning;
            }            

            // Add the value for guarded pieces
            // Promotes defending own pieces, and discourages moving defending pieces
            for (let j=0;j<weightObject.blackGuarded.length;j++) {
                // Strongly consider this if the piece is in danger
                if (weightObject.blackInDanger.includes(weightObject.blackGuarded[j])) {
                    // console.log(testMove);
                    // console.log(`${weightObject.blackGuarded[j].type} is in danger but also currently protected.`);
                    testWeight += this.protectWeight[weightObject.blackGuarded[j].type] / winning;
                }
                // but otherwise give it a low weight compared to other options.
                else {
                    testWeight += 1;
                }
            }

            // Add the value of pieces being threatened
            for (let j=0;j<weightObject.whiteInDanger.length;j++) {
                testWeight += this.pieceWeight[weightObject.whiteInDanger[j].type] * winning;
            }

            // Add the value of the piece that would be captured
            if (board.boardState[testMove[1]][testMove[2]] !== null && board.boardState[testMove[1]][testMove[2]].color==='White') {
                testWeight += this.pieceWeight[board.boardState[testMove[1]][testMove[2]].type] * this.aggressiveness * winning;
            }

            // Is this better than the existing best move? If so, this is the new best move!
            if (testWeight > bestMove.weight || bestMove.index === -1) {
                bestMove.weight = testWeight;
                bestMove.index=i;
                // console.log(testWeight);
                // console.log(testMove);
                // console.log(weightObject);
            }
        }
        
        // Put the move into practice!
        if (bestMove.index >= 0) {
            availableMovesForAI[bestMove.index][0].moveTo(null, availableMovesForAI[bestMove.index][2], availableMovesForAI[bestMove.index][1]);
        }
    },


};