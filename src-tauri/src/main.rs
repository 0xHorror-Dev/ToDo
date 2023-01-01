#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

const TODO_APPLICATION_SAVE_FOLDER:&'static str ="TODO_SV_FOLDER"; 

use std::io::{Write, Read};
use std::{env, path::PathBuf};
use std::fs::{File};
use std::sync::{Arc, Mutex};

use std::fs::OpenOptions;

use tauri::State;
use home::home_dir;

#[tauri::command]
async fn clear_file(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>, file_name: String) -> Result<(), String> 
{
    let mut clear_path:PathBuf = PathBuf::new();
    clear_path.push(&state.save_dir);
    clear_path.push(&file_name);

    match OpenOptions::new()
    .read(true)
    .write(true)
    .create(true)
    .truncate(true) // added here
    .open(clear_path.as_path())
    {
        Ok(_) => Ok(()),
        Err(err) =>
        {
            Err(format!("failed to clear file: '{}'\n error:'{}'", clear_path.display(), err.to_string()).to_owned())
        }
    }
}

#[tauri::command]
async fn view_file(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>, file_name: String) -> Result<String, String> 
{
    let mut read_path:PathBuf = PathBuf::new();
    read_path.push(&state.save_dir);
    read_path.push(&file_name);

    let mut file = match File::open(read_path.as_path())
    {
        Ok(f) => f,
        Err(err)=>
        {
            return Err(format!("failed to open file: '{}'\n error:'{}'",read_path.display(), err.to_string()).to_owned());
        }
    };

    let mut buf = String::new();
    match file.read_to_string(&mut buf)
    {
        Ok(_) =>
        {
            Ok(buf)
        }
        Err(err) => Err(format!("failed to read file: '{}'\n error:'{}'",read_path.display(), err.to_string()).to_owned())
    }
}

#[tauri::command]
async fn change_file(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>, file_name: String) -> Result<(), String> 
{
    let mut sv_file = state.save_file_name.lock().unwrap();

    sv_file.clear();
    sv_file.push_str(file_name.as_str());
    

    Ok(())
}

#[tauri::command]
async fn remove_file(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>, file_name: String) -> Result<(), String> 
{
    let mut remove_path:PathBuf = PathBuf::new();
    remove_path.push(&state.save_dir);
    remove_path.push(&file_name);

    match std::fs::remove_file(remove_path)
    {
        Ok(()) => Ok(()),
        Err(err) =>
        {
            Err(format!("failed to remove file: '{}'\nerr:{}", file_name, err.to_string()))
        }
    }
}

#[tauri::command]
async fn get_selected_file_name(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>) -> Result<String, String>
{
    let val = match state.save_file_name.lock()
    {
        Ok(v) =>
        {
            v
        },
        Err(_err)=>
        {
            return Err("failed to get data: mutex guard!".to_owned());
        }
    };


    Ok(val.clone())
    //state.save_file_name.lock().unwrap().clone()
}

#[tauri::command]
async fn write_into_file(_handle: tauri::AppHandle, state: State<'_,ApplicationInfomation>, todo_str: String) -> Result<(), String> {

    //state.save_file_name = String::new();
    //state.save_file_name.push_str("");

    let sv_file = state.save_file_name.lock().unwrap();

    let mut save_path:PathBuf = PathBuf::new();
    save_path.push(&state.save_dir);
    save_path.push(&sv_file.to_owned());

    println!("saving into:{}", &save_path.display());

    let mut file = if save_path.exists()
    {
        match OpenOptions::new()
        .write(true)
        .append(true)
        .open(save_path.as_path())
        {
            Ok(f) => f,
            Err(_) =>
            {
                return Err(format!("failed to open file:'{}'", save_path.display()));
            }
        }
    }
    else
    {
        match File::create(&save_path)
        {
            Ok(a) => a,
            Err(er) =>
            {
                return Err(format!("failed to create file: '{}'\nerr: {}", save_path.display(), er.to_string()).to_owned());
            }
        }
    };

    match writeln!(file, "{}", todo_str)
    {
        Ok(_) => Ok(()),
        Err(_err)=>  Err(format!("failed to write into file: '{}'", save_path.display()))
    }
}

struct ApplicationInfomation
{
    save_dir: String,
    save_file_name: Arc<Mutex<String>>
}

impl ApplicationInfomation
{
    pub fn new(save_dir: &str) -> ApplicationInfomation
    {
        ApplicationInfomation
        {
            save_dir:save_dir.to_owned(),
            save_file_name: Arc::new(Mutex::new(String::from("main")))
        }
    }
}

fn main() {
    let save_dir: PathBuf = match env::var(TODO_APPLICATION_SAVE_FOLDER)
    {
        Ok(val) => [val].iter().collect(),
        Err(_e) => 
        {
            let tmp = home_dir().expect("error home directory not found");
            
            let mut res_tmp = PathBuf::new();
            res_tmp.push(tmp.as_os_str());
            res_tmp.push("_todo_sv_dir");

            res_tmp
        }
    };

    if !save_dir.exists()
    {
        let prefix = save_dir.parent().unwrap();
        println!("{}", &prefix.display());
        std::fs::create_dir_all(prefix).unwrap();

        std::fs::create_dir(save_dir.as_path()).unwrap();
    }

    let inf = ApplicationInfomation::new(save_dir.to_str().unwrap());

    tauri::Builder::default()
        .manage(inf)
        .invoke_handler(tauri::generate_handler![clear_file, view_file, remove_file, get_selected_file_name, write_into_file, change_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
