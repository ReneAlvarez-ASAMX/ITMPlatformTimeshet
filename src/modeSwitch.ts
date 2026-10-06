/** Alterna entre producción y modo demo (función oculta) y recarga la app con el perfil del nuevo modo. */
export async function switchMode(currentlyDemo: boolean): Promise<void> {
  const question = currentlyDemo
    ? "¿Salir del modo demo y volver a producción?"
    : "¿Activar el modo demo?";
  if (!window.confirm(question)) return;
  const res = await window.itm.setMode(!currentlyDemo);
  if (res.ok) {
    window.location.reload();
  } else {
    window.alert(
      "No se puede cambiar de modo ahora: hay un temporizador en marcha o el modo está bloqueado."
    );
  }
}
