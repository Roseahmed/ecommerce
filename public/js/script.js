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

// update quantity of cart items
const forms = document.querySelectorAll(".form");
forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const searchParams = new URLSearchParams();
        for (const pair of formData) {
            searchParams.append(pair[0], pair[1]);
        }
        axios({
                method: "put",
                url: e.target.action,
                data: searchParams
            })
            .then((result) => {
                console.log(result);
                if (!result.data.status) {
                    alert(result.data.msg + " Available Stock:" + result.data.totalStock);
                }
                window.location.reload();
            })
            .catch((err) => {
                console.log(err);
            })
    });
});

//razor payment intigration 
// const payment = document.querySelector(".payment");
// payment.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const formData = new FormData(e.target);
//     const searchParams = new URLSearchParams();
//     for (let pair of formData) {
//         searchParams.append(pair[0], pair[1]);
//     }
//     axios({
//             method: "POST",
//             url: "/order",
//             data: searchParams
//         })
//         .then((res) => {
//             console.log(res);
//             var options = {
//                 "key": "rzp_test_g6xlzomJJhv6EL", // Enter the Key ID generated from the Dashboard 
//                 "amount": "50000",
//                 "currency": "INR",
//                 "name": "Rose Private Limited",
//                 "description": "Test Transaction",
//                 "image": "https://example.com/your_logo",
//                 "order_id": res.data.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step1
//                 "callback_url": "/order/verify",
//                 // "prefill": { "name": "Gaurav Kumar", 
//                 // "email": "gaurav.kumar@example.com", 
//                 // "contact": "9999999999" },
//                 "notes": {
//                     "address": "Razorpay Corporate Office"
//                 },
//                 "theme": {
//                     "color": "#3399cc"
//                 }
//             };
//             var rzp1 = new Razorpay(options);
//             document.getElementById('rzp-button1').onclick = function(e) {
//                 rzp1.open();
//                 e.preventDefault();
//             }
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// });