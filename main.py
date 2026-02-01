import os
import time
import requests
import re # Pour nettoyer les noms de dossiers

from dotenv import load_dotenv

# Le cœur de Selenium
from selenium import webdriver

# Pour localiser les éléments (ID, CSS, XPATH...)
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Pour simuler le clavier (Entrée, Tab, Echap...)
from selenium.webdriver.common.keys import Keys

# Pour gérer les temps d'attente (indispensable pour éviter les erreurs)
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Si vous utilisez Chrome (exemple)
from selenium.webdriver.chrome.service import Service


load_dotenv()

USERLOGIN_SECRET = os.getenv("USERLOGING")
USERPASSWORD_SECRET = os.getenv("USERPASSWORD")


# Crée le dossier s'il n'existe pas
download_path = os.path.join(os.getcwd(), "Mes_Cours_pdf")
download_path_url_links = "Mes_Cours_pdf"

linksLogs = []
if not os.path.exists(download_path):
    os.makedirs(download_path)
    
links_file_path = os.path.join(download_path_url_links, "links.txt")

# Read existing links
if os.path.exists(links_file_path):
    with open(links_file_path, "r") as fread:
        for line in fread:
            linksLogs.append(line.strip())

# Open file for appending new links
fopen = open(links_file_path, "a")
    

chromeOptions = Options()
prefs = {
    "download.default_directory": download_path, # Chemin complet et propre
    "download.prompt_for_download": False,
    "plugins.always_open_pdf_externally": True,
    "download.directory_upgrade": True # Aide à la gestion des nouveaux dossiers
}
chromeOptions.add_experimental_option("prefs", prefs)

driver = webdriver.Chrome(options=chromeOptions)
driver.get('https://foad.univ-rennes.fr/my/')

time.sleep(1)

driver.find_element(By.XPATH,"//*[@id=\"page\"]/div/div/div/div/div[2]/a").click()
driver.find_element(By.XPATH,"//*[@id=\"userInputArea\"]/div[1]/input").click()

time.sleep(1)

userLoginField = driver.find_element(By.XPATH,"//*[@id=\"usernameSection\"]/div/label")
userPasswordField = driver.find_element(By.XPATH,"//*[@id=\"passwordSection\"]/div/div[1]/label")
userPasswordField.send_keys(USERPASSWORD_SECRET)
userLoginField.send_keys(USERLOGIN_SECRET)

time.sleep(1)

driver.find_element(By.XPATH,"//*[@id=\"login-form-controls\"]/button/span").click()

time.sleep(5)

liens = driver.find_elements(By.CSS_SELECTOR, "a[href^='https://foad.univ-rennes.fr/course/view.php?id=']")

lienCoursPHP = []

for lien in liens:
        lienCoursPHP.append(lien.get_dom_attribute("href"))

lienCoursPHP = list(set(lienCoursPHP))

print(len(lienCoursPHP))

i = 0

mots_cles = ["R1","R2"]
list_folder_ressources = []
ancien_cour=""
# ... (début du code identique) ...

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

for url_cours in lienCoursPHP:
    try:
        driver.get(url_cours)
        title_page = driver.title
        
        if any(mot in title_page for mot in mots_cles):
            print(f"--- Traitement de : {title_page} ---")
           # 1. Nettoyage du titre (Enlever les caractères interdits : / \ : * ? " < > |)
            clean_title = re.sub(r'[\\/*?:"<>|]', "", title_page).strip()
            download_path = os.path.abspath(f"Mes_Cours_pdf/{clean_title}")
            
            if not os.path.exists(download_path):
                os.makedirs(download_path)

            # 2. LA MAGIE : On change le dossier sans redémarrer le driver
            driver.execute_cdp_cmd("Page.setDownloadBehavior", {
                "behavior": "allow",
                "downloadPath": download_path
            })
    
            # 1. On réinitialise la liste pour CHAQUE nouveau cours
            list_folder_ressources = []
            list_pdf_urls = []

            # 2. Sélecteurs corrigés (on enlève l'ID spécifique pour être générique)
            folders = driver.find_elements(By.CSS_SELECTOR, "a[href^='https://foad.univ-rennes.fr/mod/folder/view.php?id=']")
            ressources = driver.find_elements(By.CSS_SELECTOR, "a[href^='https://foad.univ-rennes.fr/mod/resource/view.php?id=']")

            # On regroupe les liens
            for f in folders:
                list_folder_ressources.append(f.get_attribute("href"))
            for r in ressources:
                list_folder_ressources.append(r.get_attribute("href"))

            print(f"{len(list_folder_ressources)} éléments trouvés.")

            # 3. Navigation vers chaque ressource
            for adresse in list_folder_ressources:
                try:
                    driver.get(adresse)
                    try:
                        title_cour = driver.find_element(By.XPATH,"//*[@id=\"page-header\"]/div/div[2]")
                        if title_cour == ancien_cour:
                            title_cour = ""
                        print(title_cour.text)
                        
                        pdf_links = driver.find_elements(By.CSS_SELECTOR, "a[href$='.pdf']")
                        pdf_links_2 = driver.find_elements(By.CSS_SELECTOR, "a[href$='forcedownload=1']")
                        
                        pdf_links.extend(pdf_links_2)
                        
                        for pdf_link in pdf_links:
                            pdf_link_url = pdf_link.get_attribute("href")
                            list_pdf_urls.append(pdf_link_url)
                        
                        for pdf_url in list_pdf_urls:
                            if pdf_url not in linksLogs:
                                fopen.write(pdf_url + "\n")
                                linksLogs.append(pdf_url)
                                print(f"    -> Lien PDF trouvé et enregistré : {pdf_url}")
                                driver.get(pdf_url)
                    except:
                        print("Pas trouvé de nom")
                    # On attend que le titre soit présent (plus stable que find_element direct)
                except Exception as e:
                    print(f"    ! Erreur accès ressource {adresse} : {e}")
                ancien_cour = title_cour
                    
    except Exception as e:
        print(f"Erreur globale cours : {e}")
        
fopen.close()
time.sleep(4)


try:
    driver.quit()
    
except Exception:
    
    print("Le navigateur était déjà fermé ou injoignable.")