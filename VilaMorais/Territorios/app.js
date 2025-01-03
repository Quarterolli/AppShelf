(async () => {
  "use strict"

  const view = {
    title: document.getElementById("title"),
    compass: document.getElementById("compass"),
    alert: document.getElementById("alert"),
    message: document.getElementById("message"),
    button: document.getElementById("button"),
    menu: document.getElementById("menu"),
    homeItem: document.getElementById("i0"),
    map: document.getElementById("map"),
    group: document.getElementById("group"),
    numbers: document.getElementById("numbers"),
    locate: document.getElementById("locate"),
    notify: document.getElementById("notify")
  }
  const coveredBlocks = new Set
  const warnUser = note => {
    view.message.textContent = note
    view.alert.showModal()
  }
  const handleMapTouches = touch => {
    touch.preventDefault()

    const territoryNumber = view.title.dataset.number
    let target = touch.target

    if (territoryNumber === "0" || target.parentElement.id !== "g" + territoryNumber) {
      return
    }

    while (target.tagName !== "path") {
      target = target.previousElementSibling
    }

    let label = target.nextElementSibling.textContent
    if (target.nextElementSibling?.nextElementSibling?.tagName === "text") {
      label += "/" + target.nextElementSibling.nextElementSibling.textContent
    }

    if (touch.type === "click") {
      const notFilled = !target.hasAttribute("fill")

      if (notFilled) {
        target.setAttribute("fill", "#333")
        coveredBlocks.add(label)
      } else {
        target.removeAttribute("fill")
        coveredBlocks.delete(label)
      }
    }

    if (touch.type === "contextmenu" && coveredBlocks.size === 0) {
      const [latitude, longitude] = parameters[target.parentElement.id.replace("g", "i")][label]
      
      navigator.vibrate(200)
      window.location.href = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${latitude},${longitude}`
    }
  }

  let parameters
  try {
    parameters = await (await fetch("param.json")).json()
  } catch {
    warnUser("Não foi possível ativar a interação do mapa, verifique sua internet.")
  }

  view.button.addEventListener("click", () => view.alert.close())

  document.querySelectorAll("li").forEach(item => item.addEventListener("click", click => {
    const item = click.target
    const { degrees, viewBox } = parameters[item.id]
    const territoryNumber = item.id.slice(1)

    view.title.textContent = item.textContent
    view.title.dataset.number = territoryNumber

    if(territoryNumber !== "0"){
      document.querySelectorAll(`#g${territoryNumber} path`).forEach(block =>
        block.setAttribute("style", "fill-opacity:1")
      )
      view.homeItem.classList.remove("hide")
      view.numbers.classList.add("hide")
    } else {
      view.homeItem.classList.add("hide")
      view.numbers.classList.remove("hide")
    }

    view.map.setAttribute("viewBox", viewBox)
    view.group.setAttribute("transform", `rotate(${degrees})`)
    view.compass.setAttribute("transform", `rotate(${degrees})`)
    view.menu.classList.remove("show")
  }))

  view.map.addEventListener("click", handleMapTouches)
  view.map.addEventListener("contextmenu", handleMapTouches)

  view.locate.addEventListener("click", () => {
    const territoryNumber = view.title.dataset.number

    view.menu.classList.add("show")

    coveredBlocks.clear()

    if (territoryNumber !== "0") {
      document.querySelectorAll(`#g${territoryNumber} path`).forEach(block => {
        block.removeAttribute("fill")
        block.removeAttribute("style")
      })
    }
  })

  view.notify.addEventListener("click", async () => {
    if (coveredBlocks.size === 0) {
      warnUser("Nenhum território selecionado para informar.")
      return
    }

    const today = new Date().toLocaleDateString("pt-BR")
    const territoryNumber = view.title.dataset.number
    const blocksCoordination = [...coveredBlocks].sort().reduce((coordination, block, index, array) =>
      index !== array.length - 1
        ? coordination + ", " + block
        : coordination + " e " + block
    )
    const ministryReportToday = {
      text: `Ministério ${today}\nTerritório: ${territoryNumber}\nQuadras: ${blocksCoordination}\nObservações: `
    }

    coveredBlocks.clear()
    document.querySelectorAll(`#g${territoryNumber} path`).forEach(block => block.removeAttribute("fill"))

    try {
      await navigator.share(ministryReportToday)
    } catch {
      try {
        await navigator.clipboard.writeText(ministryReportToday.text)
        warnUser("Copiado para a área de transferência.")
      } catch {
        warnUser("Este dispositivo não permite compartilhar informações com outros aplicativos.")
      }
    }
  })
})();
