let total = 0;

function addToCart(item, price) {
  const list = document.getElementById("cart-list");

  const li = document.createElement("li");
  li.innerHTML = `
    ${item} - $${price}
    <button onclick="removeItem(this, ${price})">❌</button>
  `;

  list.appendChild(li);

  total += price;
  updateTotal();
}

function removeItem(button, price) {
  button.parentElement.remove();
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
