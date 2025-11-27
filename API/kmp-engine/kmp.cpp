#include <bits/stdc++.h>
using namespace std;


vector<int> buildLPS(const string& p){
    vector<int> lps(p.size(), 0);
    int len = 0;
    for (size_t i = 1; i < p.size();) {
        if (p[i] == p[len]) lps[i++] = ++len;
        else if (len) len = lps[len - 1];
        else lps[i++] = 0;
    }
    return lps;
}

int kmpIndexOf(const string& t, const string& p){
    if (p.empty()) return 0;
    if (t.empty()) return -1;
    auto lps = buildLPS(p);
    size_t i = 0, j = 0;
    while (i < t.size()){
        if (t[i] == p[j]) {
            i++; j++;
            if (j == p.size()) return int(i - j);
        }
        else if (j) j = lps[j - 1];
        else i++;
    }
    return -1;
}


int main(int argc, char* argv[]) {
    if (argc < 3) {
        cerr << "Uso: kmp_search <patron> <ruta_csv>\n";
        return 1;
    }

    string patron = argv[1];
    string csvPath = argv[2];

    ifstream file(csvPath);
    if (!file.is_open()) {
        cerr << "No se pudo abrir el archivo CSV\n";
        return 1;
    }

    string linea;
    vector<string> sospechosos;

    // Leer encabezado
    if (!getline(file, linea)) {
        cerr << "CSV vacío\n";
        return 1;
    }

    // Validación mínima del encabezado
    // Esperado: Nombre,Secuencia
    // Pero no eliminamos espacios porque tu CSV no parece tenerlos.
    // Aun así, hacemos split.
    size_t coma = linea.find(',');
    if (coma == string::npos) {
        cerr << "CSV sin formato correcto (no tiene coma en encabezado)\n";
        return 1;
    }

    // Leer filas
    while (getline(file, linea)) {
        if (linea.empty()) continue;

        size_t commaPos = linea.find(',');
        if (commaPos == string::npos) continue;

        string nombre = linea.substr(0, commaPos);
        string secuencia = linea.substr(commaPos + 1);

        // Remover saltos de línea y posibles espacios
        nombre.erase(remove(nombre.begin(), nombre.end(), '\r'), nombre.end());
        secuencia.erase(remove(secuencia.begin(), secuencia.end(), '\r'), secuencia.end());

        // Comparar
        if (kmpIndexOf(secuencia, patron) != -1) {
            sospechosos.push_back(nombre);
        }
    }

    // Construir JSON manualmente
    cout << "{";
    cout << "\"patron\":\"" << patron << "\",";
    cout << "\"total\":" << sospechosos.size() << ",";
    cout << "\"sospechosos\":[";

    for (size_t i = 0; i < sospechosos.size(); i++) {
        cout << "\"" << sospechosos[i] << "\"";
        if (i + 1 < sospechosos.size()) cout << ",";
    }

    cout << "]";
    cout << "}";

    return 0;
}
