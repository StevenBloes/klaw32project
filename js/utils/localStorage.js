/*************************************************************************
* Local storage: getter, setter and delete functions for local storage 
* Can be used without a server
*************************************************************************/
// extract a value
export function get(name) {
  return localStorage.getItem(name);
}

// set a value
export function save(name, value) {
  localStorage.setItem(name, value);
}

// delete a value
export function remove(name) {
  localStorage.removeItem(name);
}