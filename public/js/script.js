//fuctions of homepage 
function addCartItems(id) {
    axios.patch(`/cart/${id}`)
        .then((info) => {
            console.log(info);
            // users confirmation
            if (info.data.modifiedCount > 0) {
                alert("Items added in cart.");
            } else if (info.data.modifiedCount === 0) {
                alert("Items already present in cart.");
            } else if (info.data.msg) {
                alert("Items added in current session data.");
            } else if (info.data.msg === false) {
                alert("Items already present in current session data.")
            } else {
                alert("New cartModel created for current user");
            }
        })
        .catch((err) => {
            console.log(err);
            alert("Something went wrong.")
        });
}

//functions of cart page
function deleteItem(id) {
    console.log(id);
    axios.delete(`/cart/${id}`)
        .then((result) => {
            console.log(result);
            window.location.reload();
        })
        .catch((err) => {
            console.log(err);
        });
}

function addQuantity(bookId) {
    console.log(bookId);
    axios.put(`/cart/${bookId}`)
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            console.log(err);
        });
}