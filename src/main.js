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

async function showMessage(color, msg)
{
  msgEl.style.color = color;
  msgEl.textContent = msg;
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
    showMessage("red", splittedCmd[1]);
  }
  else if(splittedCmd[0] == "success")
  {
    showMessage("green", splittedCmd[1]);
  }
  else if(splittedCmd[0] == "f" || splittedCmd[0] == "file")
  {
    await invoke("change_file", {fileName: splittedCmd[1]})
    .then(() => showMessage("green", "success!"))
    .catch((error) => showMessage("red", error));
  }
  else if(splittedCmd[0] == "cf" || splittedCmd[0] == "current_file")
  {
    await invoke("get_selected_file_name")
    .then((fileName) => showMessage("green", "file name:" + fileName))
    .catch((error) => showMessage("red", error));
  }
  else if(splittedCmd[0] == "rm" || splittedCmd[0] == "remove_file")
  {
    await invoke("remove_file", {fileName: splittedCmd[1]})
    .then(() => showMessage("green", "success!"))
    .catch((error) => showMessage("red", error));
  }
  else 
  {
    showMessage("red", "unknown command!");
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


