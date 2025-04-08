const sentiments = {
  positive: document.getElementById("positive"),
  slightlyPositive: document.getElementById("slightly-positive"),
  negative: document.getElementById("negative"),
  scared: document.getElementById("scared"),
};

async function fetchComments() {
  const res = await fetch("http://localhost:3000/api/comments");
  return await res.json();
}

function renderComments(data) {
  Object.entries(data).forEach(([sentiment, comments]) => {
    const col = sentiments[sentiment];
    if (col) {
      col.innerHTML = `<h2>${col.querySelector("h2").textContent}</h2>`;
      comments.forEach(comment => {
        const div = document.createElement("div");
        div.className = "comment";
        div.textContent = comment.body + ` (↑${comment.ups} ↓${comment.downs})`;
        div.onclick = () => navigator.clipboard.writeText(comment.body);
        col.appendChild(div);
      });
    }
  });
}

async function refresh() {
  const data = await fetchComments();
  renderComments(data);
}

refresh();
setInterval(refresh, 3000);