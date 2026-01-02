let total = 0;

function addToCart(item, price) {
  const list = document.getElementById("cart-list");

  const li = document.createElement("li");
  li.innerHTML = `${item} - $${price} <button onclick="removeItem(this,${price})">❌</button>`;
  list.appendChild(li);

  total += price;
  updateTotal();
}

function removeItem(btn, price) {
  btn.parentElement.remove();
  total -= price;
  updateTotal();
}

function clearCart() {
  document.getElementById("cart-list").innerHTML = "";
  total = 0;
  updateTotal();
}

function updateTotal() {
  document.getElementById("total").textContent = total;
}

function confirmBooking() {
  const name = document.getElementById("name").value;
  const people = document.getElementById("people").value;
  const time = document.getElementById("time").value;

  if(!name || !people || !time){
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  document.getElementById("booking").style.display = "none";
  document.getElementById("order-section").style.display = "block";

  alert(`Xin chào ${name}! Bàn cho ${people} người lúc ${time} đã được đặt.`);
}
