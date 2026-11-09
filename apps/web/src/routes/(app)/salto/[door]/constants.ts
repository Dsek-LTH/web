// The fail-safe list Salto gets when Go can't be reached or answers with an
// error. Go has the same list (backupStudentIDs in
// apps/api/internal/doors/service.go) for when a door resolves to nobody or
// its lookup fails; keep the two identical.
//
// This needs to be updated at the turn of every year,
// and it is chosen by the Head of Faculties (Källarmästare).
// Do not edit it without consulting them.
export const BACKUP_LIST_OF_STUDENT_IDS = [
  "em8241he-s", // Källarmästare, Emil Helander
  "da1677ag-s", // Processmästare, David Agardh
  "el0016sv-s", // Ordförande, Ella Svensson
  "lu7015ge-s", // Skattmästare, Ludwig Gehlsdorf
  "da6673he-s", // Revisor, Dag Hemberg
  "wi3671ri-s", // Revisor, William Rilde
];
