//add shopping cart items 
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
                alert("Something went wrong!!!");
            }
        })
        .catch((err) => {
            console.log(err);
            alert("Something went wrong.")
        });
}

//Remove shopping cart items
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

// update quantity of cart items
// const forms = document.querySelectorAll(".form");
// forms.forEach((form) => {
//     form.addEventListener("submit", (e) => {
//         e.preventDefault();
//         const formData = new FormData(e.target);
//         const searchParams = new URLSearchParams();
//         for (const pair of formData) {
//             searchParams.append(pair[0], pair[1]);
//         }
//         axios({
//                 method: "put",
//                 url: e.target.action,
//                 data: searchParams
//             })
//             .then((result) => {
//                 console.log(result);
//                 if (!result.data.status) {
//                     alert(result.data.msg + result.data.totalStock);
//                 }
//                 window.location.reload();
//             })
//             .catch((err) => {
//                 console.log(err);
//             })
//     });
// });

//update quantity of cart products
const updateQtys = document.querySelectorAll(".update-quantity");
updateQtys.forEach((updateQty) => {
    updateQty.addEventListener("input", (e) => {
        e.preventDefault();
        const productVal = e.target.value;
        if (productVal <= 0) {
            e.target.value = null;
            console.log("Quantity cann't be less than 0");
            return;
        }
        const quantity = { quantity: productVal };
        const productId = updateQty.lastElementChild.value;
        // console.log("ProductId: ", productId);
        // console.log("Quantity: ", qty);

        axios({
                method: "put",
                url: `/cart/${productId}`,
                data: quantity,
            })
            .then((result) => {
                console.log(result);
                if (!result.data.status) {
                    alert(result.data.msg + result.data.totalStock);
                }
                window.location.reload();
            })
            .catch((err) => {
                console.log(err);
            });
    });
});

//razorpay payment intigration for creating order and payments
const orderPay = document.getElementById("rzp-button1");
orderPay.addEventListener("click", (e) => {
    axios({
            method: "POST",
            url: "/checkout/place-order"
        })
        .then((res) => {
            console.log(res);
            var options = {
                "key": "rzp_test_g6xlzomJJhv6EL", // Enter the Key ID generated from the Dashboard 
                "amount": res.data.order.amount,
                "currency": "INR",
                "name": "Rose Private Limited",
                "description": "Test Transaction",
                "image": "https://example.com/your_logo",
                "order_id": res.data.order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step1
                "callback_url": "/checkout/verify-signature",
                "prefill": {
                    "name": res.data.details.name,
                    "email": res.data.details.email,
                    "contact": res.data.details.contact_no
                },
                "notes": {
                    "address": "Razorpay Corporate Office"
                },
                // "theme": {
                //     "color": "#3399cc"
                // }
            };
            return options;
        })
        .then((options) => {
            var rzp1 = new Razorpay(options);
            rzp1.open();
            e.preventDefault();
        })
        .catch((err) => {
            console.log(err);
        });
});