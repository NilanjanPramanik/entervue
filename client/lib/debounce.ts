// import debounce from 'lodash.debounce';

export function debounce(fn: (data?:any)=>void, delay: number){
  let timeoutId:any;

  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}