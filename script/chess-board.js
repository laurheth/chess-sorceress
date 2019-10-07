// Board object
const board = {
    domObject: null,
    messageObj: null,
    whoseTurn: 'White',
    boardState : [
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
    ],
    boardStateActual : null,
    aiPieces : [],
    playerPieces : [],
    // Currently selected piece
    selectedPiece : null,
    pawnToPromote: null,
    // Keep track of the two kings as they are extra important
    kings: {
        black: null,
        white: null
    },
    // Keep track of rooks for castling purposes
    rooks: {
        Black: [],
        White: []
    },
    turnNum:0,
    movesMade:[],
    // Keep track of pawns that can be taken by en passant.
    // Rules are: Only possible done by a pawn, and only possible on the turn immediately following the target pawn's double move. This variable will contain the pawn that can be targetted, and the position that it can be en passented via.
    enPassent: {
        target: null,
        row: -1,
        column: -1
    },
    sendMessage: function(message, warning=false) {
        this.messageObj.innerText=message;
        if (warning) {
            this.messageObj.classList.add('warning');
        }
        else {
            this.messageObj.classList.remove('warning');
        }
    },
    // initialize the board state
    init: function() {
        this.boardStateActual = this.boardState;
        // Store the dom object for the game. This is the root of the game.
        this.domObject = document.getElementById('game');

        // Store the dom object for the messages paragraph. This is where "CHECK" messages will be displayed
        this.messageObj = document.getElementById('gameMessages');
        board.sendMessage('-------');


        // Initialize all black (AI) pieces.
        this.boardState[0][1] = new Piece('Knight',[0,1],'Black','\u2658');
        this.boardState[0][2] = new Piece('Bishop',[0,2],'Black','\u2657');
        this.boardState[0][3] = new Piece('Queen',[0,3],'Black','\u2655');
        this.boardState[0][4] = new Piece('King',[0,4],'Black','\u2654');

        this.kings.Black = this.boardState[0][4];

        this.boardState[0][5] = new Piece('Bishop',[0,5],'Black','\u2657');
        this.boardState[0][6] = new Piece('Knight',[0,6],'Black','\u2658');

        this.boardState[0][7] = new Piece('Rook',[0,7],'Black','\u2656');
        this.boardState[0][0] = new Piece('Rook',[0,0],'Black','\u2656');

        this.rooks.Black.push(this.boardState[0][7]);
        this.rooks.Black.push(this.boardState[0][0]);

        this.boardState[1][0] = new Piece('Pawn',[1,0],'Black','\u2659');
        this.boardState[1][1] = new Piece('Pawn',[1,1],'Black','\u2659');
        this.boardState[1][2] = new Piece('Pawn',[1,2],'Black','\u2659');
        this.boardState[1][3] = new Piece('Pawn',[1,3],'Black','\u2659');
        this.boardState[1][4] = new Piece('Pawn',[1,4],'Black','\u2659');
        this.boardState[1][5] = new Piece('Pawn',[1,5],'Black','\u2659');
        this.boardState[1][6] = new Piece('Pawn',[1,6],'Black','\u2659');
        this.boardState[1][7] = new Piece('Pawn',[1,7],'Black','\u2659');
    
        // Initialize all white (player) pieces
        this.boardState[7][1] = new Piece('Knight',[7,1],'White','\u2658');
        this.boardState[7][2] = new Piece('Bishop',[7,2],'White','\u2657');
        this.boardState[7][3] = new Piece('Queen',[7,3],'White','\u2655');
        this.boardState[7][4] = new Piece('King',[7,4],'White','\u2654');

        this.kings.White = this.boardState[7][4];

        this.boardState[7][5] = new Piece('Bishop',[7,5],'White','\u2657');
        this.boardState[7][6] = new Piece('Knight',[7,6],'White','\u2658');

        this.boardState[7][7] = new Piece('Rook',[7,7],'White','\u2656');
        this.boardState[7][0] = new Piece('Rook',[7,0],'White','\u2656');

        this.rooks.White.push(this.boardState[7][7]);
        this.rooks.White.push(this.boardState[7][0]);

        this.boardState[6][0] = new Piece('Pawn',[6,0],'White','\u2659');
        this.boardState[6][1] = new Piece('Pawn',[6,1],'White','\u2659');
        this.boardState[6][2] = new Piece('Pawn',[6,2],'White','\u2659');
        this.boardState[6][3] = new Piece('Pawn',[6,3],'White','\u2659');
        this.boardState[6][4] = new Piece('Pawn',[6,4],'White','\u2659');
        this.boardState[6][5] = new Piece('Pawn',[6,5],'White','\u2659');
        this.boardState[6][6] = new Piece('Pawn',[6,6],'White','\u2659');
        this.boardState[6][7] = new Piece('Pawn',[6,7],'White','\u2659');
    },

    // Display move options for the given piece (selected via their element with an event)
    showOptions: function(element) {
        const x = parseInt(element.getAttribute('x'));
        const y = parseInt(element.getAttribute('y'));
        $('.options').removeClass('options');
        if (this.boardState[y][x] !== null) {
            if (this.whoseTurn !== this.boardState[y][x].color || this.whoseTurn === 'Black') {
                return;
            }
            // Connect the chosen element to the intended board piece
            this.selectedPiece = this.boardState[y][x];
            let options = this.selectedPiece.getOptions();
            // console.log(options);
            for (let i=0; i<options.length; i++) {

                // skip if position is outside of the board
                if (!this.onBoard(parseInt(options[i][1]),parseInt(options[i][0]))) {
                    continue;
                }

                // skip if a friendly piece
                if (this.boardState[options[i][0]][options[i][1]] !== null) {
                    if (this.boardState[options[i][0]][options[i][1]].color === this.selectedPiece.color) {
                        continue;
                    }
                    else {
                        this.boardState[options[i][0]][options[i][1]].domObject.classList.add('options');
                    }
                }
                
                // Mark the location for the player
                let $option = $(`.game .row:nth-child(${parseInt(options[i][0])+1}) .tile:nth-child(${parseInt(options[i][1])+1})`);
                $option.addClass('options');
                $option.attr('y',parseInt(options[i][0]));
                $option.attr('x',parseInt(options[i][1]));

            }
        }
    },
    // Is the given position on the board somewhere
    onBoard: function(x,y) {
        if (x>=0 && x<8 && y>=0 && y<8) {
            return true;
        }
        return false;
    },
    // Get pattern for pieces like the rook, bishop, and queen.
    // The logic for other pieces should be moved here, but I don't think I will have time to refactor that.
    getPattern: function(startX, startY, piece) {
        let optionsToReturn = [];
        let directionList = [];
        // orthogonal directions
        if (piece.type === 'Rook' || piece.type === 'Queen') {
            directionList.push([-1,0]);
            directionList.push([1,0]);
            directionList.push([0,1]);
            directionList.push([0,-1]);
        }
        // diagonals
        if (piece.type === 'Bishop' || piece.type === 'Queen') {
            directionList.push([-1,-1]);
            directionList.push([1,1]);
            directionList.push([-1,1]);
            directionList.push([1,-1]);
        }
        // A list of directions is generated above, and used below to follow those directions to their conclusion, either another piece or the end of the board
        // Note that this include the piece reach, whether friendly or otherwise.
        // Moves to friendly pieces are not valid moves, BUT the information is useful to the AI, so it is stored regardless.
        for (let i=0;i<directionList.length;i++) {
            let direction=directionList[i];
            let x=startX + direction[0];
            let y=startY + direction[1];
            while (this.onBoard(x,y)) {
                optionsToReturn.push([y,x]);
                if (this.boardState[y][x]!==null) {
                    break;
                }
                x += direction[0];
                y += direction[1];
            }
        }
        return optionsToReturn;
    },
    // Get list of all tiles available to or threatened by the given color.
    // Get the list with or without the pieces doing the threats.
    // Include or exclude pawn diagonal moves (i.e. is this for current options, or all possible threats)
    allThreatenedTiles: function(color, includePiece=true, attackOnly=false) {
        let pieces=null;

        if (color==='White') {
            pieces = this.playerPieces;
        }
        else {
            pieces = this.aiPieces;
        }
        let allThreatened=[];
        for (let i=0;i<pieces.length;i++) {
            if (pieces[i].active === false) {
                continue;
            }
            let threatened = pieces[i].getOptions(attackOnly);
            for (let j=0;j<threatened.length;j++) {
                if (includePiece) {
                    allThreatened.push([pieces[i],threatened[j][0],threatened[j][1]]);
                }
                else {
                    allThreatened.push([threatened[j][0],threatened[j][1]]);
                }
            }
            // console.log(allThreatened);
        }
        return allThreatened;
    },
    // Is a side in "check"?
    // Along the way, this also populates the given weightObject with details useful for AI decisionmaking, such as available moves by each side, pieces that are threatened, pieces that are guarded, etc.
    testForCheck: function(weightObject) {
        if (weightObject===null) {
            weightObject={};
        }
        const checkObj = {
            White: false,
            Black: false
        };
        // Get list of all threatened tiles for each side
        let whiteMoves = this.allThreatenedTiles('White',false,true);
        let blackMoves = this.allThreatenedTiles('Black',false,true);

        // The total number of moves available (for AI decisionmaking)
        weightObject.whiteMoveNum=whiteMoves.length;
        weightObject.blackMoveNum=blackMoves.length;

        // Total active pieces on each side (for AI)
        weightObject.blackActive=0;
        weightObject.whiteActive=0;
        for (let i=0;i<16;i++) {
            if (this.aiPieces[i].active) {
                weightObject.blackActive++;
            }
            if (this.playerPieces[i].active) {
                weightObject.whiteActive++;
            }
        }

        // InDanger and Guarded arrays get populated over the course of the following loops. These are used for AI but for check condition we only care about the kings
        weightObject.whiteInDanger=[];
        weightObject.blackInDanger=[];

        weightObject.whiteGuarded=[];
        weightObject.blackGuarded=[];
        for (let i=0;i<whiteMoves.length;i++) {
            // Black King in danger? Black is in check.
            if (whiteMoves[i][0] === this.kings.Black.row && whiteMoves[i][1] === this.kings.Black.column) {
                checkObj.Black=true;
            }

            // black king is constrained; disregard those moves for AI
            if (Math.abs(whiteMoves[i][0] - this.kings.Black.row)<2 && Math.abs(whiteMoves[i][1] - this.kings.Black.column)<2) {
                weightObject.blackMoveNum--; 
            }

            if (!this.onBoard(whiteMoves[i][0],whiteMoves[i][1])) {
                continue;
            }

            // Record all black pieces in danger (for AI)
            // The use of "includes" attempts to prevent duplicates, which were resulting in strange AI behaviour
            if (this.boardState[whiteMoves[i][0]][whiteMoves[i][1]] !== null && this.boardState[whiteMoves[i][0]][whiteMoves[i][1]].color==='Black') {
                if (!weightObject.blackInDanger.includes(this.boardState[whiteMoves[i][0]][whiteMoves[i][1]])) {
                    weightObject.blackInDanger.push(this.boardState[whiteMoves[i][0]][whiteMoves[i][1]]);
                }
            }
            // Record all white pieces guarded by a white piece (for AI)
            if (this.boardState[whiteMoves[i][0]][whiteMoves[i][1]] !== null && this.boardState[whiteMoves[i][0]][whiteMoves[i][1]].color==='White') {
                if (!weightObject.whiteGuarded.includes(this.boardState[whiteMoves[i][0]][whiteMoves[i][1]]))
                {
                    weightObject.whiteGuarded.push(this.boardState[whiteMoves[i][0]][whiteMoves[i][1]]);
                }
            }
        }
        // Repeat the above for the other team...
        for (let i=0;i<blackMoves.length;i++) {
            // White king in danger? White is in check
            if (blackMoves[i][0] === this.kings.White.row && blackMoves[i][1] === this.kings.White.column) {
                checkObj.White=true;
            }
            
            // black king is constrained
            if (Math.abs(blackMoves[i][0] - this.kings.White.row)<2 && Math.abs(blackMoves[i][1] - this.kings.White.column)<2) {
                weightObject.whiteMoveNum--; 
            }

            if (!this.onBoard(blackMoves[i][0],blackMoves[i][1])) {
                continue;
            }

            // White pieces in danger
            if (this.boardState[blackMoves[i][0]][blackMoves[i][1]] !== null && this.boardState[blackMoves[i][0]][blackMoves[i][1]].color==='White') {
                if (!weightObject.whiteInDanger.includes(this.boardState[blackMoves[i][0]][blackMoves[i][1]])) {
                    weightObject.whiteInDanger.push(this.boardState[blackMoves[i][0]][blackMoves[i][1]]);
                }
            }

            // Black pieces guarded.
            if (this.boardState[blackMoves[i][0]][blackMoves[i][1]] !== null && this.boardState[blackMoves[i][0]][blackMoves[i][1]].color==='Black') {
                if (!weightObject.blackGuarded.includes(this.boardState[blackMoves[i][0]][blackMoves[i][1]])) {
                    weightObject.blackGuarded.push(this.boardState[blackMoves[i][0]][blackMoves[i][1]]);
                }
            }
        }

        return checkObj;
    },
    // Is the game over?
    testForGameEnd: function() {
        // Is the game currently in a check state?
        const currentCheckState = this.testForCheck(null);
        const hasValidMoves={White: false, Black: false};
        // This loop finds out if both sides have viable moves left
        const side=['Black','White'];
        for (let i=0;i<2;i++) {
            let checkSide=side[i];
            const availableMoves = board.allThreatenedTiles(checkSide);
            let validMoveExists=false;
            // For each available move, check if it is valid
            for (let j=0;j<availableMoves.length;j++) {
                let testMove = availableMoves[j];
                // Moves to own pieces are invalid
                if (this.boardState[testMove[1]][testMove[2]] !== null && this.boardState[testMove[1]][testMove[2]].color===checkSide) {
                    continue;
                }

                // Moves that result in a check condition are invalid
                if (!testMove[0].moveTo(null,testMove[2],testMove[1],false,true,null)) {
                    continue;
                }
                // If a valid move exists, the game is not over. Short circuit, and continue play!
                validMoveExists=true;
                break;
            }
            hasValidMoves[checkSide]=validMoveExists;
        }

        if (!hasValidMoves.White && board.whoseTurn==='White') {
            if (currentCheckState.White) {
                this.sendMessage("White is in checkmate! Game over.",true);
            }
            else {
                this.sendMessage("Stalemate! The game is a draw.",true);
            }
            board.whoseTurn="";
        }
        if (!hasValidMoves.Black && board.whoseTurn==='Black') {
            if (currentCheckState.Black) {
                this.sendMessage("Black is in checkmate! You win!");
            }
            else {
                this.sendMessage("Stalemate! The game is a draw.",true);
            }
            board.whoseTurn="";
        }
    },
    undoButton: function() {
        // goes back 2 full turns (one white, one black)
        if (this.turnNum < 2) {
            // if not valid, don't do it!
            return;
        }

        // Go back two turns if it is an even numbered turn (i.e. white's turn). One turn otherwise (only happens if undoing from game end)
        if (this.turnNum % 2 ==0) {
            this.turnNum -= 2;
        } else {
            this.turnNum--;
        }
        // While loops are dangerous and I don't trust them. This variable adds a condition for them to break out on their own in case there is an infinite loop
        let breaker=6;

        // While there's more moves to undo, and while the current move to be undone is later than the goal turn to return to
        while(breaker > 0 && this.movesMade.length>0 && this.movesMade[this.movesMade.length-1].turnNum>=this.turnNum) {
            breaker--;
            
            // Get the last move in the array
            let undoThisMove = this.movesMade.pop();
            if (undoThisMove===undefined) {
                break;
            }

            // Move the piece that moved back to its original position
            undoThisMove.piece.moveTo(undoThisMove.domObject, undoThisMove.originalColumn, undoThisMove.originalRow, false, false, null, true);

            // If that was its first move, set it back to "hasn't moved yet"
            undoThisMove.piece.hasMoved = undoThisMove.hasMoved;

            // If a piece was captured, revive it
            if (undoThisMove.capturedPiece !== null) {
                undoThisMove.capturedPiece.unDie();
            }

            // If a pawn was promoted, demote it
            if (undoThisMove.promotion) {
                undoThisMove.piece.type="Pawn";
                undoThisMove.piece.paragraphElement.textContent='\u2659';
            }

            // Refresh the en passent details from before
            this.enPassent = Object.assign({},undoThisMove.enPassent);

            // Revert turn to white's turn
            board.whoseTurn='White';
        }

        // confirm that active pieces are in fact active
        for (let i=0;i<this.aiPieces;i++) {
            this.aiPieces[i].unDie();
        }
        for (let i=0;i<this.playerPieces;i++) {
            this.playerPieces[i].unDie();
        }
        if (this.turnNum===0) {
            $('.undo').addClass('disabled');
        }
    },
    // super lazy reset button. Just keep on slamming that undo button until you can't anymore
    resetButton: function() {
        while (this.turnNum > 0) {
            this.undoButton();
        }
    },

    // Function to promote pawns
    promotePawn: function(type, symbol) {
        // Promote the pawn
        this.pawnToPromote.type=type;
        this.pawnToPromote.paragraphElement.textContent=symbol;
        // Forget about the pawn. No more need to promote.
        this.pawnToPromote=null;
        // Hide the selection prompt
        $('.promotion').addClass('hidemessage');
        // Continue play with the AI's turn.
        chessAI.runAI();
    }
};