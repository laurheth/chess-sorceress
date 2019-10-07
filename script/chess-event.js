// Document ready, and event handlers
$(document).ready(function() {
    board.init();

    // What to do if you click on a piece
    // Event delegation because pieces are created at run-time.
    // I should rethink this a bit.
    $('.game').on('click', 'div.piece', function () {
        board.showOptions(this);
    });

    // What to do when clicking on a position to move the piece to
    // Event delegation because the 'options' class is dynamically added and removed as needed!
    $('.game').on('click', '.options' ,function() {
        if (board.selectedPiece !== null) {
            board.selectedPiece.moveTo(this);
            $('.options').removeClass('options');
        }
    });

    // The undo button!
    $('.undo').on('click', function() {
        $('.options').removeClass('options');
        board.undoButton();
    });

    // The reset button. Doesn't reset immediately, instead queries the player if they are sure
    $('.restart').on('click', function() {
        $('.overlaymessages').removeClass('hidemessage');
    });

    // No! Don't restart! Hide the message
    $('#noRestart').on('click', function() {
        $('.overlaymessages').addClass('hidemessage');
    })

    // Yes! Restart! Hide the message and run the restart function
    $('#yesRestart').on('click', function() {
        $('.options').removeClass('options');
        $('.overlaymessages').addClass('hidemessage');
        board.resetButton();
    });

    // The promotion buttons!
    $('.promoteButton').on('click', function() {
        const symbols={
            Queen: '♕',
            Knight: '♘',
            Rook: '♖',
            Bishop: '♗'
        }
        // Upgrade option is stored in the button id's
        // Symbol is grabbed from the object
        let id=$(this).attr('id');
        board.promotePawn(id,symbols[id]);
    });
});
