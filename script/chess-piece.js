// Piece constructor
function Piece(type, position, color, symbol) {
    this.type=type;
    this.row = position[0];
    this.column = position[1];
    this.color=color;
    this.hasMoved=false;
    this.paragraphElement=null;
    this.active=true;
    this.lastMoved=0;
    // If it's an AI piece, add to the aiPieces array
    if (color === 'Black') {
        board.aiPieces.push(this);
    }
    else {
        board.playerPieces.push(this);
    }

    // Add the dom element containing the piece
    this.domObject = document.createElement("DIV");
    this.domObject.classList.add('piece');
    if (color === 'Black') {
        this.domObject.classList.add('black');
    }
    this.domObject.setAttribute('x',position[1]);
    this.domObject.setAttribute('y',position[0]);


    // start position
    this.domObject.style.left=`${position[1]*12.5}%`;
    this.domObject.style.top=`${position[0]*12.5}%`;

    // Add the symbol
    this.paragraphElement = document.createElement("P");
    this.paragraphElement.textContent=symbol;

    // Attach to the board
    this.domObject.appendChild(this.paragraphElement);
    board.domObject.appendChild(this.domObject);

    // Function to define possible target spaces
    this.getOptions = function(attackOnly=false) {
        let optionArr=[];
        switch(this.type) {
            case 'Pawn':
                let upDown=0;
                if (this.color === 'White') {
                    upDown=-1;
                }
                else {
                    upDown=1;
                }
                if (!attackOnly) {
                    // Step forward IF AND ONLY IF the space is open
                    if (board.onBoard(this.column,this.row+upDown) && board.boardState[this.row+upDown][this.column] === null) {
                        optionArr.push([this.row+upDown , this.column]);
                        // if first move, can jump a second spot
                        if (!this.hasMoved) {
                            if (board.boardState[this.row+2*upDown][this.column] === null) {
                                optionArr.push([this.row+2*upDown , this.column]);
                            }
                        }
                    }
                }
                
                // If there are enemies in the diagonal, wreck them!
                // Alternatively, if getting threatened spaces, diagonals are the danger spots!
                if (attackOnly || (board.onBoard(this.row+upDown,this.column+1) && board.boardState[this.row+upDown][this.column+1] !== null) || (board.enPassent.target!==null && board.enPassent.row === (this.row+upDown) && board.enPassent.column === (this.column+1))) {
                    optionArr.push([this.row+upDown , this.column+1]);
                }
                if (attackOnly || (board.onBoard(this.row+upDown,this.column-1) && board.boardState[this.row+upDown][this.column-1] !== null) || (board.enPassent.target!==null && board.enPassent.row === (this.row+upDown) && board.enPassent.column === (this.column-1))) {
                    optionArr.push([this.row+upDown , this.column-1]);
                }
                break;
            case 'Knight':
                let knightSteps = [
                    [2,1],
                    [1,2],
                    [-1,2],
                    [-2,1],
                    [2,-1],
                    [1,-2],
                    [-1,-2],
                    [-2,-1]
                ];
                for (let i=0;i<knightSteps.length;i++) {
                    let nextStep = [knightSteps[i][0]+this.row,knightSteps[i][1]+this.column];
                    if (board.onBoard(nextStep[1],nextStep[0])) {
                        optionArr.push([nextStep[0], nextStep[1]]);
                    }
                }
                break;
            case 'King':
                for (let i=-1;i<2;i++) {
                    for (let j=-1;j<2 ;j++) {
                        if (i==0 && j==0) {
                            continue;
                        }
                        if (board.onBoard(this.row +i, this.column + j)) {
                            optionArr.push([this.row + i, this.column + j]);
                        }
                    }
                }
                // Test for castling as a potential option
                // conditions are:
                // 1. king and rook have not moved
                // 2. Space between them has to be empty
                // 3. King cannot currently be in check
                // 4. Neither the target space nor the intervening space may be threatened
                // This test only runs if attackOnly === false, to prevent infinite loops (infinite oops)
                if (!attackOnly && this.hasMoved === false) {
                    for (let i=0;i<2;i++) {
                        if (board.rooks[this.color][i].hasMoved) {
                            continue; // skip if the rook as moved
                        }
                        let leftOrRight = (board.rooks[this.color][i].column - this.column) > 0 ? 1 : -1;
                        // test if the space between them is empty
                        if ((board.boardState[this.row][this.column + leftOrRight]) === null &&
                        (board.boardState[this.row][this.column + 2*leftOrRight]) === null && 
                        (
                            (board.boardState[this.row][this.column + 3*leftOrRight]) === null ||
                            (board.boardState[this.row][this.column + 3*leftOrRight]) === board.rooks[this.color][i]
                        )) {

                            // TO ADD: check threatened squares
                            let opponentThreats;
                            if (this.color==='White') {
                                opponentThreats=board.allThreatenedTiles('Black', false, true);
                            }
                            else {
                                opponentThreats=board.allThreatenedTiles('White', false, true);
                            }

                            // check each threatened square. Does it include the king or the intervening spaces?
                            let safe=true;
                            for (let j=0;j<opponentThreats.length;j++) {
                                let testPosition = opponentThreats[j];
                                if (testPosition[0] === this.row && (testPosition[1] === this.column || testPosition[1] === this.column + leftOrRight || testPosition[1] === this.column + 2*leftOrRight) ) {
                                    safe=false;
                                    break;
                                }
                            }

                            if (safe) {
                                optionArr.push([this.row, this.column + 2*leftOrRight]);
                            }

                        }
                    }
                }
                break;
            default:
                optionArr = board.getPattern(this.column, this.row, this);
                break;
        }
        return optionArr;
    };

    this.moveTo = function(element, x=null, y=null, progressTurn=true, testOnly=false,weightObject=null, unDoing=false) {

        if (x === null && y === null) {
            x = parseInt(element.getAttribute('x'));
            y = parseInt(element.getAttribute('y'));
        }

        let didCastle=null;

        let moveBeingMade = {
            originalRow: this.row,
            originalColumn: this.column,
            // originalHasMoved: this.hasMoved;
            capturedPiece: board.boardState[y][x]
        }

        board.boardState[this.row][this.column] = null;

        // Pawn double move logic; store in enPassent variable if double move
        if (this.type==='Pawn') {
            
            // Alternatively, check if this pawn is performing an en passent, and capture the other piece
            if (board.enPassent.target !== null && board.enPassent.target.color !== this.color) {
                if (x === board.enPassent.column && y === board.enPassent.row) {
                    board.enPassent.target.die();
                    moveBeingMade.capturedPiece = board.enPassent.target;
                    // board.enPassent.target=null;
                }
            }
        }

        // King castling logic.
        // If King is double moving horizontally, it is a castle move (assumes earlier check was proper!)
        // Finds rook in that direction and moves it as well
        // if undoing, the ook move is stored as a different move to undo, so skip this logic
        if (this.type === 'King') {
            if (!unDoing && Math.abs(this.column - x)==2 && this.row === y) {
                let rookPos={row:this.row, column: (x > this.column) ? 7 : 0 };
                let rookToMove = board.boardState[rookPos.row][rookPos.column];
                if (rookToMove.type === 'Rook') {
                    // Move the rook, but don't progress the turn for it!
                    if (!testOnly) {
                        rookToMove.moveTo( rookToMove.domObject, (this.column + x)/2, this.row, false );
                    }
                    else {
                        didCastle={
                            rookMoved:rookToMove,
                            originalRow: rookToMove.row,
                            originalColumn: rookToMove.column
                        };
                        board.boardState[rookPos.row][rookPos.column]=null;
                        board.boardState[this.row][(this.column + x)/2]=rookToMove;
                        rookToMove.row=this.row;
                        rookToMove.column=(this.column + x)/2;
                    }
                }
            }
        }

        this.row=y;
        this.column=x;

        // console.log(x,y);
        if (board.boardState[y][x] !== null) {
            // board.boardState[y][x].die();
            moveBeingMade.capturedPiece.die();
        }

        board.boardState[y][x] = this;

        // Test for check condition
        let wouldCauseCheck=false;

        // weightObject = board.getWeights();

        const checkObj = board.testForCheck(weightObject);
        // If undoing, ignore possible check condition.
        if (checkObj[this.color]) {
            // oh no! this move would cause a check condition.
            wouldCauseCheck=true;
        }

        // Actually implement the changes
        if (!testOnly && (!wouldCauseCheck || unDoing) ) {

            if (checkObj.White) {
                board.sendMessage('White is in check!', true);
            }
            else if (checkObj.Black) {
                board.sendMessage('Black is in check!', true);
            }
            else {
                board.sendMessage('-------');
            }
            
            // Record the move
            let moveObj = {
                turnNum: board.turnNum,
                piece: this,
                originalRow: moveBeingMade.originalRow,
                originalColumn: moveBeingMade.originalColumn,
                endRow: this.row,
                endColumn: this.column,
                capturedPiece: moveBeingMade.capturedPiece,
                hasMoved: this.hasMoved,
                promotion: false,
                enPassent: Object.assign({},board.enPassent)
            };
            // en passent designation
            if (this.type==='Pawn') {
                // did the pawn double move?
                if (Math.abs(this.row - moveBeingMade.originalRow)==2 && moveBeingMade.originalColumn === this.column) {
                    // if so, store it in enPassent for future reference
                    board.enPassent.target=this;
                    board.enPassent.column = x;
                    board.enPassent.row = (this.row + moveBeingMade.originalRow)/2;
                }
            }

            // Upgrade pawns!
            if (this.type==='Pawn' && (this.row === 0 || this.row === 7)) {
                if (board.whoseTurn === 'White') {
                    board.pawnToPromote = this;
                    $('.promotion').removeClass('hidemessage');
                }
                else {
                    this.type='Queen';
                    this.paragraphElement.textContent='♕';
                }
                moveObj.promotion = true;
            }

            // Record the move (if not undoing)
            if (!unDoing) {
                $('.undo').removeClass('disabled');
                board.movesMade.push(moveObj);
            }

            this.lastMoved=board.turnNum;

            this.hasMoved=true;

            // Switch whose turn it is
            if (progressTurn) {
                // board.movesMade.push([]);
                board.turnNum++;
                // console.log(board.movesMade.slice());
                if (board.enPassent.target !== null) {
                    if (board.enPassent.target.color !== this.color) {
                        board.enPassent.target = null;
                    }
                }
                if (this.color === 'White') {
                    board.whoseTurn='Black';

                    // Use setTimeout to give the illusion that the AI has to think about it a bit.
                    // If promotion prompt is open, don't do this. It will be called after the player makes their selection.

                    if (board.pawnToPromote === null) {
                        setTimeout(function() {
                            chessAI.runAI();
                        }
                        ,300 + Math.floor(300 * Math.random()));
                    }
                }
                else {
                    board.whoseTurn='White';
                }
                // Test if this move ended the game.
                board.testForGameEnd();
            }

            // Update the dom element for the piece
            this.domObject.setAttribute('y',this.row);
            this.domObject.setAttribute('x',this.column);

            this.domObject.style.left=`${x*12.5}%`;
            this.domObject.style.top=`${y*12.5}%`;
        }
        // test only OR would cause a check condition. Revert changes, this move didn't happen!
        else {
            if (!testOnly && this.color === 'White') {
                board.sendMessage('That move would put your king into check!', true);
            }

            // Revert target space to initial conditions and revive any captured piece
            board.boardState[this.row][this.column] = null;
            if (moveBeingMade.capturedPiece !== null) {
                moveBeingMade.capturedPiece.unDie();
            }

            // Revert this pieces position
            this.row=moveBeingMade.originalRow;
            this.column=moveBeingMade.originalColumn;
            board.boardState[this.row][this.column] = this;

            // If castling was done, undo that too.
            if (didCastle != null) {
                board.boardState[didCastle.rookMoved.row][didCastle.rookMoved.column]=null;
                didCastle.rookMoved.row = didCastle.originalRow;
                didCastle.rookMoved.column = didCastle.originalColumn;
                board.boardState[didCastle.rookMoved.row][didCastle.rookMoved.column]=didCastle.rookMoved;
            }
        }
        return !wouldCauseCheck;
    };

    this.die = function() {
        this.active=false;
        board.boardState[this.row][this.column] = null;
        this.domObject.classList.add('dead');
    };

    this.unDie = function() {
        this.active=true;
        board.boardState[this.row][this.column] = this;
        this.domObject.classList.remove('dead');
    }
}