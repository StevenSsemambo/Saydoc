import React,{createContext,useContext,useState,useEffect,useCallback}from'react'
import{getUser,saveUser,getPreferences,savePreferences}from'../db/database.js'

const AppContext=createContext(null)

export function AppProvider({children}){
  const[user,setUser]=useState(null)
  const[prefs,setPrefs]=useState({theme:'dark',notifications:true})
  const[loading,setLoading]=useState(true)
  const[onboarded,setOnboarded]=useState(false)

  useEffect(()=>{
    let done=false

    // Safety timeout: if DB init takes >5s, unblock the UI
    const timeout=setTimeout(()=>{
      if(!done){done=true;setLoading(false)}
    },5000)

    async function init(){
      try{
        const u=await getUser()
        if(u){setUser(u);setOnboarded(true)
          const p=await getPreferences(u.id)
          if(p)setPrefs(p)
        }
      }catch(e){console.error('DB init error:',e)}
      finally{
        if(!done){done=true;clearTimeout(timeout);setLoading(false)}
      }
    }
    init()
    return()=>{done=true;clearTimeout(timeout)}
  },[])

  const completeOnboarding=useCallback(async(data)=>{
    const id=await saveUser(data)
    const u={...data,id}
    setUser(u);setOnboarded(true)
    return u
  },[])

  const updateUser=useCallback(async(data)=>{
    const updated={...user,...data}
    await saveUser(updated)
    setUser(updated)
  },[user])

  return(
    <AppContext.Provider value={{user,prefs,loading,onboarded,completeOnboarding,updateUser,setUser}}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp=()=>useContext(AppContext)
