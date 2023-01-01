const { invoke } = window.__TAURI__.tauri;

let inputBoxEl;
let fontchangeEl;
let msgEl;

function focusElement(el)
{
  el.focus();
  el.select();
}

async function textInputListener(e)
{
  if(e.code == "Enter")
  {
    let userInput = inputBoxEl.value;
    if(userInput[0] == '/')
    {
      let cmd = userInput.substring(1);
      executeUIChange(cmd);
    }
    else
    {
      await invoke("write_into_file", { todoStr: inputBoxEl.value })
      .then(() => showMessage("green", "success!"))
      .catch((error) => showMessage("red", error));
    }
  }
  else if(e.code == "Escape")
  {

  }
}

async function showMessage(color, _align, msg)
{
  msgEl.style.textAlign = _align;
  msgEl.style.color = color;
  
  let splittedMsg = msg.split('\n');
  
  msgEl.textContent = "";

  if(splittedMsg.length > 0)
  {
    splittedMsg.forEach(function(item, i, arr) {
      msgEl.textContent += "\n\r";
      msgEl.textContent += item;
    });
  }
  else
  {
    msgEl.textContent = msg;
  }

}

async function executeUIChange(cmd)
{
  var splittedCmd = cmd.split(':');

  if(splittedCmd.length < 2)
  {
    await showError("syntax error!");
    return;
  }

  if(splittedCmd[0] == "fl")
  {
    console.log("set fl on:" + splittedCmd[1]);
  }
  else if(splittedCmd[0] == "error")
  {
    showMessage("red", "center", splittedCmd[1]);
  }
  else if(splittedCmd[0] == "success")
  {
    showMessage("green","center", splittedCmd[1]);
  }
  else if(splittedCmd[0] == "text")
  {
    msgEl.style.textAlign = "left";
    showMessage("white", "center", splittedCmd[1]);
  }
  else if(splittedCmd[0] == "f" || splittedCmd[0] == "file")
  {
    await invoke("change_file", {fileName: splittedCmd[1]})
    .then(() => showMessage("green","center", "success!"))
    .catch((error) => showMessage("red","center", error));
  }
  else if(splittedCmd[0] == "r" || splittedCmd[0] == "read")
  {
    await invoke("view_file", {fileName: splittedCmd[1]})
    .then((text) => 
    {
      console.log(text);
      showMessage("white","left", text);
    })
    .catch((error) => showMessage("red","center", error));
  }
  else if(splittedCmd[0] == "cf" || splittedCmd[0] == "current_file")
  {
    await invoke("get_selected_file_name")
    .then((fileName) => showMessage("green","center", "file name:" + fileName))
    .catch((error) => showMessage("red","center", error));
  }
  else if(splittedCmd[0] == "rm" || splittedCmd[0] == "remove_file")
  {
    await invoke("remove_file", {fileName: splittedCmd[1]})
    .then(() => showMessage("green","center", "success!"))
    .catch((error) => showMessage("red","center", error));
  }
  else if(splittedCmd[0] == "cls" || splittedCmd[0] == "clear")
  {
    await invoke("clear_file", {fileName: splittedCmd[1]})
    .then(() => showMessage("green","center", "success!"))
    .catch((error) => showMessage("red","center", error));
  }
  else if(splittedCmd[0] == "font-f" || splittedCmd[0] == "font-family")
  {
    inputBoxEl.style.fontFamily = splittedCmd[1];
    msgEl.style.fontFamily = splittedCmd[1];
    showMessage("green","center", "success!");
  }
  else if(splittedCmd[0] == "font-s" || splittedCmd[0] == "font-size")
  {
    inputBoxEl.style.fontSize = splittedCmd[1] + 'pt';
    msgEl.style.fontSize = splittedCmd[1] + 'pt';
    showMessage("green","center", "success!");
  }
  else
  {
    showMessage("red","center", "unknown command!");
  }
}

async function fontChange()
{
  //inputBoxEl.style.fontFamily = "Consolas";
  executeUIChange(inputBoxEl.value);
}

window.addEventListener("DOMContentLoaded", () => {

  inputBoxEl = document.querySelector("#todo-input");
  msgEl = document.querySelector("#res-msg");

  focusElement(inputBoxEl);
  document.addEventListener('keyup', textInputListener);
});


