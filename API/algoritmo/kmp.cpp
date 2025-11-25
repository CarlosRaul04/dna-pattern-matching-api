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
        if (t[i] == p[j]) { i++; j++; if (j == p.size()) return int(i - j); }
        else if (j) j = lps[j - 1];
        else i++;
    }
    return -1;
}
int main(int argc, char* argv[]){
    if (argc < 3) { cerr << "Uso: kmp_search <patron> <secuencia>\n"; return 1; }
    string pattern = argv[1];
    string sequence = argv[2];
    cout << kmpIndexOf(sequence, pattern) << endl;
    return 0;
}
