import requests
from bs4 import BeautifulSoup
import json
import time
import re

# 目标网站基础 URL
BASE_URL = "http://121.42.201.251/se/?switch=7&sub="

def scrape_all_chapters():
    question_bank = []
    
    print("🚀 开始爬取浙江大学软件工程题库...")

    for sub in range(1, 37):  # 遍历第 1 到 36 章
        url = f"{BASE_URL}{sub}"
        try:
            response = requests.get(url, timeout=10)
            # 自动识别编码（该站点通常为 GBK 或 UTF-8）
            response.encoding = response.apparent_encoding 
            
            soup = BeautifulSoup(response.text, 'html.parser')
            content = soup.find('div', id='content')
            
            if not content:
                print(f"⚠️ 第 {sub} 章未找到内容，跳过。")
                continue
                
            chapter_name = content.find('h2').get_text(strip=True) if content.find('h2') else f"第 {sub} 章"
            print(f"📖 正在解析: {chapter_name}")

            # 寻找所有的题目段落
            p_tags = content.find_all('p')
            
            for p in p_tags:
                # 跳过显示答案的段落和空格
                if 'show' in p.get('class', []) or not p.get_text(strip=True):
                    continue
                
                # 提取题目文本并清理开头的数字
                raw_text = p.get_text(strip=True)
                question_text = re.sub(r'^\d+\.\s*', '', raw_text)
                
                if len(question_text) < 2: continue

                options = []
                answer = ""
                
                # 遍历后续兄弟节点获取选项和答案
                curr = p.next_sibling
                while curr:
                    if curr.name == 'p':
                        if 'show' in curr.get('class', []):
                            # 提取正确答案
                            answer = curr.get_text(strip=True).replace('正确答案：', '').strip()
                        break # 到达下一个题目块
                    
                    # 提取选项（文本节点或 input 后跟的文本）
                    if isinstance(curr, str):
                        opt_text = curr.strip()
                        if opt_text and re.match(r'^[A-G]\.', opt_text):
                            options.append(opt_text)
                    elif curr.name == 'input':
                        next_node = curr.next_sibling
                        if next_node and isinstance(next_node, str):
                            opt_text = next_node.strip()
                            if opt_text:
                                options.append(opt_text)
                            curr = next_node  # 跳过已处理的文本节点，避免重复
                            
                    curr = curr.next_sibling
                
                question_bank.append({
                    "id": f"q_{sub}_{len(question_bank)}",
                    "chapter": chapter_name,
                    "text": question_text,
                    "options": options,
                    "answer": answer
                })

            # 适当延时，保护服务器
            time.sleep(0.3)

        except Exception as e:
            print(f"❌ 抓取第 {sub} 章出错: {e}")

    # 保存为 JSON 文件
    with open('question_bank.json', 'w', encoding='utf-8') as f:
        json.dump(question_bank, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 抓取完成！共收集 {len(question_bank)} 道题目。")
    print("📁 结果已保存至: question_bank.json")

if __name__ == "__main__":
    scrape_all_chapters()